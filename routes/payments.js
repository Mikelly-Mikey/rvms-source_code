const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { Payment, Booking, Customer, Vehicle } = require('../models');
const { body, validationResult } = require('express-validator');
const { logActivity } = require('../utils/activityLogger');

router.get('/', requireAuth, requirePermission('manage_payments'), async (req, res) => {
  const payments = await Payment.findAll({
    include: [{ model: Booking, as: 'booking' }],
    order: [['payment_date', 'DESC']]
  });
  res.render('payments/list', { payments, user: req.user });
});

// Record a payment against a booking
router.post(
  '/record',
  requireAuth,
  requirePermission('manage_payments'),
  [
    body('booking_id').isInt().withMessage('Valid booking ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
    body('method').isIn(['cash', 'mpesa', 'bank_transfer', 'card']).withMessage('Valid payment method is required'),
    body('reference').optional().trim(),
    body('notes').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).redirect('/payments');
    }

    try {
      const { booking_id, amount, method, reference, notes } = req.body;
      const paymentAmount = parseFloat(amount);

      const booking = await Booking.findByPk(booking_id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: Vehicle, as: 'vehicle' }
        ]
      });

      if (!booking) {
        return res.status(404).render('error', { message: 'Booking not found' });
      }

      // Record the payment
      await Payment.create({
        booking_id,
        amount: paymentAmount,
        method,
        reference: reference || null,
        status: 'completed',
        recorded_by: req.user.id,
        notes: notes || null
      });

      // Update booking deposit_paid and balance_due
      const newDepositPaid = parseFloat(booking.deposit_paid || 0) + paymentAmount;
      const newBalanceDue = parseFloat(booking.total_amount || 0) - newDepositPaid;

      await booking.update({
        deposit_paid: newDepositPaid,
        balance_due: Math.max(0, newBalanceDue)
      });

      // Log activity
      await logActivity(
        req.user,
        'payment',
        'booking',
        booking.booking_id,
        `Recorded KES ${paymentAmount.toLocaleString()} payment for booking ${booking.booking_reference}`
      );

      res.redirect('/payments');
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).render('error', { message: 'Error recording payment' });
    }
  }
);

module.exports = router;
