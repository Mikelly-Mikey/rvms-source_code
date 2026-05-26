const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { Vehicle } = require('../models');
const { logActivity } = require('../utils/activityLogger');
const { body } = require('express-validator');

// Validation rules
const createVehicleValidation = [
  body('make').trim().notEmpty().withMessage('Vehicle make is required'),
  body('model').trim().notEmpty().withMessage('Vehicle model is required'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
  body('registration').trim().notEmpty().withMessage('Registration number is required'),
  body('category').isIn(['economy', 'compact', 'suv', 'luxury']).withMessage('Valid category is required'),
  body('transmission').isIn(['automatic', 'manual']).withMessage('Valid transmission type is required'),
  body('fuel_type').isIn(['petrol', 'diesel', 'electric', 'hybrid']).withMessage('Valid fuel type is required'),
  body('seating_capacity').isInt({ min: 2, max: 20 }).withMessage('Valid seating capacity is required'),
  body('daily_rate').isFloat({ min: 0 }).withMessage('Valid daily rate is required'),
  body('weekly_rate').isFloat({ min: 0 }).withMessage('Valid weekly rate is required'),
  body('color').optional().trim(),
  body('description').optional().trim(),
  body('image_url').optional().isURL().withMessage('Valid image URL is required'),
];

router.get('/', requireAuth, async (req, res) => {
  // Customers can view vehicles, staff can manage them
  if (req.user.role === 'customer') {
    // Customers only see available vehicles
    const vehicles = await Vehicle.findAll({ 
      where: { status: 'available' },
      order: [['created_at', 'DESC']] 
    });
    res.render('vehicles/list', { vehicles, user: req.user });
  } else {
    // Staff see all vehicles
    const vehicles = await Vehicle.findAll({ order: [['created_at', 'DESC']] });
    res.render('vehicles/list', { vehicles, user: req.user });
  }
});

router.get('/create', requireAuth, requirePermission('manage_vehicles'), (req, res) => {
  res.render('vehicles/form', { user: req.user });
});

router.post('/create', requireAuth, requirePermission('manage_vehicles'), createVehicleValidation, async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    
    // Log activity
    await logActivity(req.user, 'create', 'vehicle', vehicle.vehicle_id, `Added new vehicle ${vehicle.registration} (${vehicle.make} ${vehicle.model})`);
    
    res.redirect('/vehicles');
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error creating vehicle' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  const vehicle = await Vehicle.findByPk(req.params.id);
  if (!vehicle) return res.status(404).render('error', { message: 'Vehicle not found' });
  res.render('vehicles/detail', { vehicle, user: req.user });
});

// Check vehicle availability for specific dates
router.get('/:id/availability', requireAuth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const { Booking } = require('../models');
    const { Op } = require('sequelize');

    const conflicting = await Booking.findOne({
      where: {
        vehicle_id: req.params.id,
        status: { [Op.in]: ['confirmed', 'checked-out'] },
        [Op.or]: [
          { start_date: { [Op.between]: [start_date, end_date] } },
          { end_date: { [Op.between]: [start_date, end_date] } },
          { start_date: { [Op.lte]: start_date }, end_date: { [Op.gte]: end_date } }
        ]
      }
    });

    res.json({
      vehicle_id: vehicle.vehicle_id,
      available: !conflicting,
      status: vehicle.status,
      message: conflicting ? 'Vehicle is not available for these dates' : 'Vehicle is available'
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Error checking availability' });
  }
});

// Delete vehicle
router.post('/:id/delete', requireAuth, requirePermission('manage_vehicles'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).render('error', { message: 'Vehicle not found' });
    }

    // Only allow deletion of vehicles that are not currently rented or reserved
    if (vehicle.status === 'on-rent' || vehicle.status === 'reserved') {
      return res.status(400).render('error', { message: 'Cannot delete vehicle that is currently rented or reserved' });
    }

    // Log activity before deletion
    await logActivity(req.user, 'delete', 'vehicle', vehicle.vehicle_id, `Removed vehicle ${vehicle.registration} (${vehicle.make} ${vehicle.model})`);

    // Delete the vehicle
    await vehicle.destroy();

    res.redirect('/vehicles');
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).render('error', { message: 'Error deleting vehicle' });
  }
});

module.exports = router;
