const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { Payment, Booking } = require('../models');

router.get('/', requireAuth, requirePermission('manage_payments'), async (req, res) => {
  const payments = await Payment.findAll({
    include: [{ model: Booking, as: 'booking' }],
    order: [['payment_date', 'DESC']]
  });
  res.render('payments/list', { payments, user: req.user });
});

module.exports = router;
