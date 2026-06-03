const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { Payment, Booking, Customer, Vehicle, MpesaTransaction } = require('../models');
const { body, validationResult } = require('express-validator');
const { logActivity } = require('../utils/activityLogger');
const { sendPaymentConfirmation } = require('../utils/emailService');
const mpesa = require('../utils/mpesaService');

// Apply a completed payment to a booking: update deposit/balance and (best-effort)
// email the customer a confirmation. Shared by manual and M-Pesa payments.
async function applyPaymentToBooking(booking, payment) {
  const paymentAmount = parseFloat(payment.amount);
  const newDepositPaid = parseFloat(booking.deposit_paid || 0) + paymentAmount;
  const newBalanceDue = parseFloat(booking.total_amount || 0) - newDepositPaid;
  await booking.update({
    deposit_paid: newDepositPaid,
    balance_due: Math.max(0, newBalanceDue)
  });

  try {
    const customer = booking.customer || (await Customer.findByPk(booking.customer_id));
    if (customer && customer.email) {
      await sendPaymentConfirmation(customer, payment, booking);
    }
  } catch (err) {
    console.error('Payment confirmation email failed:', err.message);
  }
}

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
      const payment = await Payment.create({
        booking_id,
        amount: paymentAmount,
        method,
        reference: reference || null,
        status: 'completed',
        recorded_by: req.user.id,
        notes: notes || null
      });

      // Update booking balances and notify the customer
      await applyPaymentToBooking(booking, payment);

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

// --- M-Pesa (Safaricom) STK Push -------------------------------------------

// Initiate an STK push for a booking. Records a pending MpesaTransaction and asks
// Safaricom (or the simulator) to prompt the customer's phone for their PIN.
router.post(
  '/mpesa/stkpush',
  requireAuth,
  requirePermission('manage_payments'),
  [
    body('booking_id').isInt().withMessage('Valid booking ID is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least KES 1'),
    body('phone').trim().notEmpty().withMessage('Phone number is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const { booking_id, amount, phone } = req.body;
      const paymentAmount = parseFloat(amount);

      const booking = await Booking.findByPk(booking_id);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (!mpesa.isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number. Use 07XXXXXXXX or 2547XXXXXXXX.'
        });
      }

      const result = await mpesa.initiateStkPush({
        phone,
        amount: paymentAmount,
        accountRef: booking.booking_reference,
        description: `Payment for ${booking.booking_reference}`
      });

      await MpesaTransaction.create({
        booking_id: booking.booking_id,
        checkout_request_id: result.checkoutRequestId,
        merchant_request_id: result.merchantRequestId,
        amount: paymentAmount,
        phone_number: result.phone,
        status: 'pending'
      });

      return res.json({
        success: true,
        simulated: result.simulated === true,
        checkoutRequestId: result.checkoutRequestId,
        message: result.customerMessage || 'STK push sent. Awaiting confirmation...'
      });
    } catch (error) {
      console.error('Error initiating M-Pesa STK push:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to initiate M-Pesa payment'
      });
    }
  }
);

// Safaricom callback (also used by the simulator). Public endpoint - no auth.
router.post('/mpesa/callback', async (req, res) => {
  // Always acknowledge so Safaricom does not retry.
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const parsed = mpesa.parseCallback(req.body);
    if (!parsed) return;

    const tx = await MpesaTransaction.findOne({
      where: { checkout_request_id: parsed.checkoutRequestId }
    });
    if (!tx || tx.status !== 'pending') return;

    if (!parsed.success) {
      await tx.update({
        status: parsed.resultCode === 1032 ? 'cancelled' : 'failed',
        result_code: parsed.resultCode,
        result_desc: parsed.resultDesc,
        completed_at: new Date()
      });
      return;
    }

    await tx.update({
      status: 'completed',
      mpesa_receipt: parsed.receipt,
      result_code: parsed.resultCode,
      result_desc: parsed.resultDesc,
      completed_at: new Date()
    });

    const booking = await Booking.findByPk(tx.booking_id, {
      include: [{ model: Customer, as: 'customer' }]
    });
    if (!booking) return;

    const payment = await Payment.create({
      booking_id: booking.booking_id,
      amount: tx.amount,
      method: 'mpesa',
      reference: parsed.receipt,
      status: 'completed',
      recorded_by: booking.created_by || null,
      notes: `M-Pesa STK push (${tx.phone_number})`
    });

    await applyPaymentToBooking(booking, payment);
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
  }
});

// Poll the status of an STK push (used by the payments UI).
router.get(
  '/mpesa/status/:checkoutRequestId',
  requireAuth,
  requirePermission('manage_payments'),
  async (req, res) => {
    try {
      const tx = await MpesaTransaction.findOne({
        where: { checkout_request_id: req.params.checkoutRequestId }
      });
      if (!tx) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      return res.json({
        success: true,
        status: tx.status,
        receipt: tx.mpesa_receipt,
        resultDesc: tx.result_desc
      });
    } catch (error) {
      console.error('Error fetching M-Pesa status:', error);
      return res.status(500).json({ success: false, message: 'Error fetching status' });
    }
  }
);

module.exports = router;
