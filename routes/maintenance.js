const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { Maintenance, Vehicle } = require('../models');

router.get('/', requireAuth, requirePermission('manage_maintenance'), async (req, res) => {
  const maintenanceRecords = await Maintenance.findAll({
    include: [{ model: Vehicle, as: 'vehicle' }],
    order: [['service_date', 'DESC']]
  });
  res.render('maintenance/dashboard', { maintenanceRecords, user: req.user });
});

module.exports = router;
