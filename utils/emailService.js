const nodemailer = require("nodemailer");
const AfricasTalking = require("africastalking");
require("dotenv").config();

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true", // Use 'true' for 465, 'false' for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Africa's Talking SMS setup
const africastalking = AfricasTalking({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME,
});
const sms = africastalking.SMS;

/**
 * Sends a verification email to a user.
 * @param {Object} user - The user object containing email, first_name, and verification token.
 * @param {string} token - The verification token.
 */
async function sendVerificationEmail(user, token) {
  const verificationLink = `${process.env.APP_URL}/auth/verify-email?userId=${user.id}&token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "RVMS Account Verification",
    html: `
      <p>Hello ${user.first_name},</p>
      <p>Thank you for registering with RVMS. Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationLink}">Verify My Email Address</a></p>
      <p>If you did not register for an account, please ignore this email.</p>
      <p>Regards,<br>The RVMS Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${user.email}`);
  } catch (error) {
    console.error(`Error sending verification email to ${user.email}:`, error);
    throw new Error("Failed to send verification email.");
  }
}

/**
 * Sends a payment confirmation email to a customer.
 * @param {Object} customer - The customer object.
 * @param {Object} payment - The payment object.
 * @param {Object} booking - The booking object.
 */
async function sendPaymentConfirmation(customer, payment, booking) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: customer.email,
    subject: `RVMS Payment Confirmation for Booking ${booking.booking_reference}`,
    html: `
      <p>Hello ${customer.first_name},</p>
      <p>This is a confirmation that your payment of KES ${payment.amount.toLocaleString()} for booking ${booking.booking_reference} has been successfully processed.</p>
      <p><strong>Payment Details:</strong></p>
      <ul>
        <li>Amount Paid: KES ${payment.amount.toLocaleString()}</li>
        <li>Method: ${payment.method}</li>
        <li>Reference: ${payment.reference || "N/A"}</li>
        <li>Booking Total: KES ${booking.total_amount.toLocaleString()}</li>
        <li>Balance Due: KES ${booking.balance_due.toLocaleString()}</li>
      </ul>
      <p>Thank you for choosing RVMS!</p>
      <p>Regards,<br>The RVMS Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Payment confirmation email sent to ${customer.email}`);
  } catch (error) {
    console.error(
      `Error sending payment confirmation email to ${customer.email}:`,
      error,
    );
    throw new Error("Failed to send payment confirmation email.");
  }
}

/**
 * Sends a booking confirmation email.
 */
async function sendBookingConfirmation(user, booking, vehicle) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `Booking Confirmed: ${booking.booking_reference}`,
    html: `
      <p>Hello ${user.first_name},</p>
      <p>Your booking for <strong>${vehicle.make} ${vehicle.model}</strong> (${vehicle.registration}) has been confirmed.</p>
      <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>
      <p><strong>Pick-up:</strong> ${new Date(booking.start_date).toLocaleDateString()} at ${booking.pickup_time}</p>
      <p><strong>Total Amount:</strong> KES ${booking.total_amount.toLocaleString()}</p>
      <p>Please ensure you have your driving license ready during pick-up.</p>
      <p>Regards,<br>RVMS Team</p>
    `,
  };
  return transporter.sendMail(mailOptions);
}

/**
 * Sends an invoice/receipt email after vehicle return.
 */
async function sendInvoiceEmail(email, name, invoiceData) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Invoice for Booking ${invoiceData.invoice_number}`,
    html: `
      <p>Hello ${name},</p>
      <p>Thank you for using RVMS. Attached is your rental summary.</p>
      <div style="background: #f9f9f9; padding: 15px; border: 1px solid #ddd;">
        <h3>Summary for ${invoiceData.registration}</h3>
        <p>Total Amount: KES ${invoiceData.total_amount.toLocaleString()}</p>
        <p>Deposit Paid: KES ${invoiceData.deposit_paid.toLocaleString()}</p>
        <p><strong>Balance Due: KES ${invoiceData.balance_due.toLocaleString()}</strong></p>
      </div>
      <p>We hope to see you again soon!</p>
      <p>Regards,<br>RVMS Team</p>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send invoice email:", error.message);
  }
}

async function sendBookingCancellation(user, booking, vehicle) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `Booking Cancelled - ${booking.booking_reference}`,
    html: `
      <p>Hello ${user.first_name},</p>
      <p>Your booking <strong>${booking.booking_reference}</strong> for ${vehicle.make} ${vehicle.model} (${vehicle.registration}) has been cancelled.</p>
      <p>Your balance has been cleared to <strong>KES 0</strong>. No invoice will be issued for this booking.</p>
      <p>Regards,<br>RVMS Team</p>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Cancellation email sent to ${user.email}`);
  } catch (error) {
    console.error(`Error sending cancellation email:`, error.message);
  }
}

async function sendSms(to, message) {
  try {
    await sms.send({ to, message });
    console.log(`SMS sent to ${to}: ${message}`);
  } catch (error) {
    console.error(`Error sending SMS to ${to}:`, error);
    throw new Error("Failed to send SMS.");
  }
}

module.exports = {
  sendVerificationEmail,
  sendPaymentConfirmation,
  sendBookingConfirmation,
  sendInvoiceEmail,
  sendBookingCancellation,
  sendSms,
};
