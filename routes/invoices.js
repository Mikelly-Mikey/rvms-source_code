const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { Booking } = require('../models');
const { generateInvoiceData, generateInvoiceHTML } = require('../utils/invoiceGenerator');

// Generate invoice for a booking
router.get('/booking/:bookingId', requireAuth, async (req, res) => {
  try {
    const invoiceData = await generateInvoiceData(req.params.bookingId);
    if (invoiceData.status === 'cancelled') {
      return res.status(400).render('error', { message: 'No invoice available for cancelled bookings' });
    }
    const invoiceHTML = generateInvoiceHTML(invoiceData);
    
    res.send(invoiceHTML);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).render('error', { message: 'Error generating invoice' });
  }
});

// Download invoice as PDF (simplified - just HTML for now)
router.get('/download/:bookingId', requireAuth, async (req, res) => {
  try {
    const invoiceData = await generateInvoiceData(req.params.bookingId);
    if (invoiceData.status === 'cancelled') {
      return res.status(400).render('error', { message: 'No invoice available for cancelled bookings' });
    }
    const invoiceHTML = generateInvoiceHTML(invoiceData);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=${invoiceData.invoice_number}.html`);
    res.send(invoiceHTML);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).render('error', { message: 'Error downloading invoice' });
  }
});

module.exports = router;
