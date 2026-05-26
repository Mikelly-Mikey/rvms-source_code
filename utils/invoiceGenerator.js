const { Booking, Customer, Vehicle } = require('../models');

// Generate invoice number
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
};

// Generate invoice data
const generateInvoiceData = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Customer,
        as: 'customer'
      },
      {
        model: Vehicle,
        as: 'vehicle'
      }
    ]
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  const invoiceData = {
    invoice_number: generateInvoiceNumber(),
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customer: {
      name: `${booking.customer.first_name} ${booking.customer.last_name}`,
      email: booking.customer.email || 'N/A',
      phone: booking.customer.phone,
      id_number: booking.customer.id_number
    },
    vehicle: {
      make: booking.vehicle.make,
      model: booking.vehicle.model,
      year: booking.vehicle.year,
      registration: booking.vehicle.registration,
      category: booking.vehicle.category
    },
    booking: {
      reference: booking.booking_reference,
      start_date: booking.start_date,
      end_date: booking.end_date,
      pickup_time: booking.pickup_time,
      return_time: booking.return_time,
      days: days
    },
    charges: {
      daily_rate: parseFloat(booking.vehicle.daily_rate),
      days: days,
      subtotal: parseFloat(booking.vehicle.daily_rate) * days,
      damage_charges: parseFloat(booking.damage_charges || 0),
      fuel_charges: parseFloat(booking.fuel_charges || 0),
      late_fee: parseFloat(booking.late_fee || 0)
    },
    totals: {
      subtotal: parseFloat(booking.vehicle.daily_rate) * days,
      additional_charges: (parseFloat(booking.damage_charges || 0) + parseFloat(booking.fuel_charges || 0) + parseFloat(booking.late_fee || 0)),
      total_amount: parseFloat(booking.total_amount),
      deposit_paid: parseFloat(booking.deposit_paid || 0),
      balance_due: parseFloat(booking.balance_due)
    }
  };

  return invoiceData;
};

// Generate HTML invoice
const generateInvoiceHTML = (invoiceData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #667eea;
      margin: 0;
    }
    .invoice-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .invoice-details div {
      flex: 1;
    }
    .invoice-details h3 {
      margin-top: 0;
      color: #667eea;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .totals {
      text-align: right;
      margin-top: 20px;
    }
    .totals .total {
      font-size: 1.2em;
      font-weight: bold;
      color: #667eea;
    }
    .footer {
      text-align: center;
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
    }
    .badge-success {
      background: #28a745;
      color: white;
    }
    .badge-warning {
      background: #ffc107;
      color: #333;
    }
    .badge-danger {
      background: #dc3545;
      color: white;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚗 RVMS - INVOICE</h1>
    <p>Vehicle Rental Management System</p>
  </div>

  <div class="invoice-details">
    <div>
      <h3>Invoice Details</h3>
      <p><strong>Invoice #:</strong> ${invoiceData.invoice_number}</p>
      <p><strong>Invoice Date:</strong> ${invoiceData.invoice_date}</p>
      <p><strong>Due Date:</strong> ${invoiceData.due_date}</p>
    </div>
    <div>
      <h3>Customer Details</h3>
      <p><strong>Name:</strong> ${invoiceData.customer.name}</p>
      <p><strong>Email:</strong> ${invoiceData.customer.email}</p>
      <p><strong>Phone:</strong> ${invoiceData.customer.phone}</p>
      <p><strong>ID Number:</strong> ${invoiceData.customer.id_number}</p>
    </div>
  </div>

  <h3>Booking Information</h3>
  <p><strong>Reference:</strong> ${invoiceData.booking.reference}</p>
  <p><strong>Vehicle:</strong> ${invoiceData.vehicle.make} ${invoiceData.vehicle.model} (${invoiceData.vehicle.year})</p>
  <p><strong>Registration:</strong> ${invoiceData.vehicle.registration}</p>
  <p><strong>Category:</strong> ${invoiceData.vehicle.category}</p>
  <p><strong>Rental Period:</strong> ${invoiceData.booking.start_date} to ${invoiceData.booking.end_date} (${invoiceData.booking.days} days)</p>
  <p><strong>Pickup Time:</strong> ${invoiceData.booking.pickup_time} | <strong>Return Time:</strong> ${invoiceData.booking.return_time}</p>

  <h3>Charges</h3>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Rental Charges (${invoiceData.charges.daily_rate.toLocaleString()} KES/day × ${invoiceData.charges.days} days)</td>
        <td>KES ${invoiceData.charges.subtotal.toLocaleString()}</td>
      </tr>
      ${invoiceData.charges.damage_charges > 0 ? `
      <tr>
        <td>Damage Charges</td>
        <td>KES ${invoiceData.charges.damage_charges.toLocaleString()}</td>
      </tr>
      ` : ''}
      ${invoiceData.charges.fuel_charges > 0 ? `
      <tr>
        <td>Fuel Charges</td>
        <td>KES ${invoiceData.charges.fuel_charges.toLocaleString()}</td>
      </tr>
      ` : ''}
      ${invoiceData.charges.late_fee > 0 ? `
      <tr>
        <td>Late Fee</td>
        <td>KES ${invoiceData.charges.late_fee.toLocaleString()}</td>
      </tr>
      ` : ''}
      <tr>
        <td><strong>Subtotal</strong></td>
        <td><strong>KES ${invoiceData.totals.subtotal.toLocaleString()}</strong></td>
      </tr>
      <tr>
        <td>Additional Charges</td>
        <td>KES ${invoiceData.totals.additional_charges.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <p><strong>Total Amount:</strong> KES ${invoiceData.totals.total_amount.toLocaleString()}</p>
    <p><strong>Deposit Paid:</strong> KES ${invoiceData.totals.deposit_paid.toLocaleString()}</p>
    <p class="total"><strong>Balance Due:</strong> KES ${invoiceData.totals.balance_due.toLocaleString()}</p>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>For questions regarding this invoice, please contact our support team.</p>
    <p>&copy; ${new Date().getFullYear()} RVMS. All rights reserved.</p>
  </div>
</body>
</html>
  `;
};

module.exports = {
  generateInvoiceNumber,
  generateInvoiceData,
  generateInvoiceHTML
};
