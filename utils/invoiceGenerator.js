const PDFDocument = require("pdfkit");

/**
 * Generates a PDF invoice for a booking and streams it to the response.
 *
 * @param {Object} booking - The booking object (should include customer and vehicle)
 * @param {Object} res - Express response object
 */
function generateBookingInvoice(booking, res) {
  const doc = new PDFDocument({ margin: 50 });

  // Set response headers for PDF download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Invoice_${booking.booking_reference}.pdf`,
  );

  doc.pipe(res);

  // Company Header
  doc.fontSize(25).text("RVMS", 50, 50, { bold: true });
  doc.fontSize(10).text("Rental Vehicle Management System", 50, 80);
  doc.text("Nairobi, Kenya", 50, 95);
  doc.text("Phone: +254 792 192 374", 50, 110);
  doc.moveDown();

  // Invoice Label and metadata
  doc.fontSize(20).text("INVOICE", 400, 50, { align: "right" });
  doc.fontSize(10).text(`Reference: ${booking.booking_reference}`, 400, 80, {
    align: "right",
  });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 400, 95, {
    align: "right",
  });

  doc.moveTo(50, 130).lineTo(550, 130).stroke();
  doc.moveDown();

  // Billing Information
  doc.fontSize(12).text("BILL TO:", 50, 150, { bold: true });
  doc
    .fontSize(10)
    .text(
      `${booking.customer.first_name} ${booking.customer.last_name}`,
      50,
      165,
    );
  doc.text(booking.customer.email, 50, 180);
  doc.text(booking.customer.phone, 50, 195);

  // Rental Information
  doc.fontSize(12).text("RENTAL DETAILS:", 300, 150, { bold: true });
  doc
    .fontSize(10)
    .text(`${booking.vehicle.make} ${booking.vehicle.model}`, 300, 165);
  doc.text(`Registration: ${booking.vehicle.registration}`, 300, 180);
  doc.text(
    `Period: ${new Date(booking.start_date).toLocaleDateString()} - ${new Date(booking.end_date).toLocaleDateString()}`,
    300,
    195,
  );

  doc.moveDown(4);

  // Line Items Table Header
  const tableTop = 250;
  doc.fontSize(10).text("Description", 50, tableTop, { bold: true });
  doc.text("Amount (KES)", 400, tableTop, { bold: true, align: "right" });
  doc
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke();

  // Line Item
  let itemY = tableTop + 30;
  doc.text(
    `Vehicle Rental Charge (${booking.vehicle.registration})`,
    50,
    itemY,
  );
  doc.text(parseFloat(booking.total_amount).toLocaleString(), 400, itemY, {
    align: "right",
  });

  // Summary Totals
  const totalY = itemY + 50;
  doc.moveTo(300, totalY).lineTo(550, totalY).stroke();

  doc.text("Total Amount:", 300, totalY + 10);
  doc.text(
    parseFloat(booking.total_amount).toLocaleString(),
    400,
    totalY + 10,
    { align: "right" },
  );

  doc.text("Amount Paid:", 300, totalY + 25);
  doc.text(
    parseFloat(booking.deposit_paid).toLocaleString(),
    400,
    totalY + 25,
    { align: "right" },
  );

  doc.fontSize(12).text("BALANCE DUE:", 300, totalY + 45, { bold: true });
  doc.text(
    `KES ${parseFloat(booking.balance_due).toLocaleString()}`,
    400,
    totalY + 45,
    { bold: true, align: "right" },
  );

  // Footer
  doc
    .fontSize(10)
    .text(
      "Thank you for your business. Please ensure the vehicle is returned in good condition.",
      50,
      700,
      { align: "center", width: 500 },
    );

  doc.end();
}

/**
 * Aggregates data required for an invoice from multiple models.
 */
async function generateInvoiceData(bookingId) {
  const { Booking, Customer, Vehicle, Payment } = require("../models");
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: Customer, as: "customer" },
      { model: Vehicle, as: "vehicle" },
      { model: Payment, as: "payments" },
    ],
  });

  if (!booking) throw new Error("Booking not found");

  return {
    invoice_number: booking.booking_reference,
    date: new Date().toLocaleDateString(),
    customer_name: `${booking.customer.first_name} ${booking.customer.last_name}`,
    registration: booking.vehicle.registration,
    vehicle_model: `${booking.vehicle.make} ${booking.vehicle.model}`,
    total_amount: parseFloat(booking.total_amount),
    deposit_paid: parseFloat(booking.deposit_paid),
    balance_due: parseFloat(booking.balance_due),
    status: booking.status,
  };
}

/**
 * Returns a simple HTML representation of the invoice.
 */
function generateInvoiceHTML(data) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 30px;">
      <h1>RVMS INVOICE</h1>
      <p>Reference: ${data.invoice_number}</p>
      <p>Date: ${data.date}</p>
      <hr>
      <p><strong>Customer:</strong> ${data.customer_name}</p>
      <p><strong>Vehicle:</strong> ${data.vehicle_model} (${data.registration})</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0;">Total Amount</td><td style="text-align: right;">KES ${data.total_amount.toLocaleString()}</td></tr>
        <tr><td style="padding: 10px 0;">Amount Paid</td><td style="text-align: right;">KES ${data.deposit_paid.toLocaleString()}</td></tr>
        <tr style="font-weight: bold; border-top: 2px solid #333;"><td style="padding: 10px 0;">BALANCE DUE</td><td style="text-align: right;">KES ${data.balance_due.toLocaleString()}</td></tr>
      </table>
      <p style="margin-top: 50px; text-align: center; color: #777;">Thank you for choosing RVMS!</p>
    </div>
  `;
}

module.exports = {
  generateBookingInvoice,
  generateInvoiceData,
  generateInvoiceHTML,
};
