const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send booking confirmation email
const sendBookingConfirmation = async (user, booking, vehicle) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'RVMS <noreply@rvms.com>',
    to: user.email,
    subject: `Booking Confirmation - ${booking.booking_reference}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .booking-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear ${user.first_name} ${user.last_name},</p>
            <p>Your vehicle booking has been confirmed. Here are your booking details:</p>
            
            <div class="booking-details">
              <h3>Booking Reference: ${booking.booking_reference}</h3>
              <p><strong>Vehicle:</strong> ${vehicle.make} ${vehicle.model} (${vehicle.year})</p>
              <p><strong>Registration:</strong> ${vehicle.registration}</p>
              <p><strong>Start Date:</strong> ${new Date(booking.start_date).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> ${new Date(booking.end_date).toLocaleDateString()}</p>
              <p><strong>Pickup Time:</strong> ${booking.pickup_time}</p>
              <p><strong>Return Time:</strong> ${booking.return_time}</p>
              <p><strong>Total Amount:</strong> KES ${parseFloat(booking.total_amount).toLocaleString()}</p>
            </div>
            
            <p>Please arrive 15 minutes before your pickup time with:</p>
            <ul>
              <li>Valid driver's license</li>
              <li>National ID or Passport</li>
              <li>Payment confirmation</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/customer-dashboard" class="btn">View My Bookings</a>
            </p>
          </div>
          <div class="footer">
            <p>Thank you for choosing RVMS. If you have any questions, please contact us.</p>
            <p>&copy; ${new Date().getFullYear()} RVMS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
  }
};

// Send booking cancellation email
const sendBookingCancellation = async (user, booking, vehicle) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'RVMS <noreply@rvms.com>',
    to: user.email,
    subject: `Booking Cancelled - ${booking.booking_reference}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .booking-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancelled</h1>
          </div>
          <div class="content">
            <p>Dear ${user.first_name} ${user.last_name},</p>
            <p>Your booking has been cancelled. Here are the cancelled booking details:</p>
            
            <div class="booking-details">
              <h3>Booking Reference: ${booking.booking_reference}</h3>
              <p><strong>Vehicle:</strong> ${vehicle.make} ${vehicle.model} (${vehicle.year})</p>
              <p><strong>Cancelled Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>If you did not request this cancellation, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} RVMS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking cancellation email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending booking cancellation email:', error);
  }
};

// Send payment confirmation email
const sendPaymentConfirmation = async (user, payment, booking) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'RVMS <noreply@rvms.com>',
    to: user.email,
    subject: `Payment Confirmation - ${payment.reference}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .payment-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Payment Received!</h1>
          </div>
          <div class="content">
            <p>Dear ${user.first_name} ${user.last_name},</p>
            <p>Your payment has been received and confirmed.</p>
            
            <div class="payment-details">
              <h3>Payment Reference: ${payment.reference}</h3>
              <p><strong>Amount:</strong> KES ${parseFloat(payment.amount).toLocaleString()}</p>
              <p><strong>Method:</strong> ${payment.method}</p>
              <p><strong>Date:</strong> ${new Date(payment.payment_date).toLocaleDateString()}</p>
              <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>
            </div>
            
            <p>Thank you for your payment. Your booking is confirmed.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} RVMS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Payment confirmation email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
};

// Send review approval notification
const sendReviewApprovalNotification = async (user, review, vehicle) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'RVMS <noreply@rvms.com>',
    to: user.email,
    subject: `Your Review Has Been Published!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .review-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⭐ Review Published!</h1>
          </div>
          <div class="content">
            <p>Dear ${user.first_name} ${user.last_name},</p>
            <p>Your review for ${vehicle.make} ${vehicle.model} has been approved and is now visible on our platform.</p>
            
            <div class="review-details">
              <p><strong>Rating:</strong> ${'⭐'.repeat(review.rating)}</p>
              ${review.comment ? `<p><strong>Your Comment:</strong> "${review.comment}"</p>` : ''}
            </div>
            
            <p>Thank you for sharing your experience with us!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} RVMS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Review approval notification sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending review approval notification:', error);
  }
};

module.exports = {
  sendBookingConfirmation,
  sendBookingCancellation,
  sendPaymentConfirmation,
  sendReviewApprovalNotification
};
