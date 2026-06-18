const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { Maintenance, MaintenanceSchedule, Vehicle } = require('../models');
const { body, validationResult } = require('express-validator');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');

router.get('/', requireAuth, requirePermission('manage_maintenance'), async (req, res) => {
  const isMechanic = req.user.role === 'mechanic';
  const scheduleWhere = isMechanic
    ? {
        status: { [Op.in]: ['pending', 'in_progress'] },
        [Op.or]: [{ assigned_to: req.user.id }, { assigned_to: null }],
      }
    : { status: { [Op.in]: ['pending', 'in_progress'] } };

  const [maintenanceRecords, pendingSchedules] = await Promise.all([
    Maintenance.findAll({
      include: [{ model: Vehicle, as: 'vehicle' }],
      order: [['service_date', 'DESC']],
      limit: 20,
    }),
    MaintenanceSchedule.findAll({
      where: scheduleWhere,
      include: [{ model: Vehicle, as: 'vehicle' }],
      order: [['scheduled_date', 'ASC']],
    }),
  ]);

  res.render('maintenance/dashboard', {
    maintenanceRecords,
    pendingSchedules,
    user: req.user,
    success: req.query.success || null,
    error: req.query.error || null,
  });
});

router.post(
  '/:scheduleId/complete',
  requireAuth,
  requirePermission('manage_maintenance'),
  [
    body('cost').isFloat({ min: 0 }).withMessage('Valid cost is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('provider').trim().notEmpty().withMessage('Provider is required'),
    body('mileage').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect(`/maintenance?error=${encodeURIComponent(errors.array()[0].msg)}`);
    }

    try {
      const schedule = await MaintenanceSchedule.findByPk(req.params.scheduleId, {
        include: [{ model: Vehicle, as: 'vehicle' }],
      });

      if (!schedule) {
        return res.redirect('/maintenance?error=Maintenance%20task%20not%20found');
      }

      if (schedule.status === 'completed') {
        return res.redirect('/maintenance?error=Task%20already%20completed');
      }

      const { cost, description, provider, mileage } = req.body;

      await Maintenance.create({
        vehicle_id: schedule.vehicle_id,
        service_date: new Date(),
        mileage: parseInt(mileage, 10) || schedule.vehicle.current_mileage || 0,
        service_type: schedule.service_type,
        description,
        cost: parseFloat(cost),
        provider,
        completed_by: req.user.id,
      });

      await schedule.update({ status: 'completed' });

      await schedule.vehicle.update({ status: 'available' });

      await logActivity(
        req.user,
        'complete',
        'maintenance',
        schedule.schedule_id,
        `Completed ${schedule.service_type} for ${schedule.vehicle.registration} — vehicle returned to available`
      );

      res.redirect('/maintenance?success=Maintenance%20completed.%20Vehicle%20is%20now%20available.');
    } catch (error) {
      console.error('Error completing maintenance:', error);
      res.redirect('/maintenance?error=Failed%20to%20complete%20maintenance');
    }
  }
);

module.exports = router;
