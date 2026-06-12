const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { Booking, Customer, Vehicle, Payment, User } = require('../models');
const { Op } = require('sequelize');
const { logActivity } = require('../utils/activityLogger');
const { body, validationResult } = require('express-validator');
const { sendBookingConfirmation, sendInvoiceEmail } = require('../utils/emailService');
const { generateInvoiceData } = require('../utils/invoiceGenerator');

// Validation rules
const createBookingValidation = [
  body('customer_id').isInt().withMessage('Valid customer ID is required'),
  body('vehicle_id').isInt().withMessage('Valid vehicle ID is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('pickup_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid pickup time is required (HH:MM)'),
  body('return_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid return time is required (HH:MM)'),
];

const checkoutValidation = [
  body('check_out_mileage').isFloat({ min: 0 }).withMessage('Valid mileage is required'),
  body('check_out_fuel').optional().isInt({ min: 0, max: 100 }).withMessage('Fuel level must be 0-100%'),
  body('check_out_notes').optional().trim(),
];

const returnValidation = [
  body('check_in_mileage').isFloat({ min: 0 }).withMessage('Valid mileage is required'),
  body('check_in_fuel').optional().isInt({ min: 0, max: 100 }).withMessage('Fuel level must be 0-100%'),
  body('check_in_notes').optional().trim(),
  body('damage_charges').optional().isFloat({ min: 0 }).withMessage('Valid damage charges is required'),
  body('fuel_charges').optional().isFloat({ min: 0 }).withMessage('Valid fuel charges is required'),
  body('late_fee').optional().isFloat({ min: 0 }).withMessage('Valid late fee is required'),
];

// List all bookings
router.get('/', requireAuth, requirePermission('manage_bookings'), async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: Customer, as: 'customer' },
        { model: Vehicle, as: 'vehicle' }
      ],
      order: [['created_date', 'DESC']]
    });
    res.render('bookings/list', { bookings, user: req.user });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).render('error', { message: 'Error fetching bookings' });
  }
});

// Show create form
router.get('/create', requireAuth, requirePermission('manage_bookings'), async (req, res) => {
  try {
    const customers = await Customer.findAll({ order: [['first_name', 'ASC']] });
    const vehicles = await Vehicle.findAll({ where: { status: 'available' } });
    const selectedVehicleId = req.query.vehicle_id || null;
    res.render('bookings/create', { customers, vehicles, user: req.user, error: null, selectedVehicleId });
  } catch (error) {
    console.error('Error loading booking form:', error);
    res.status(500).render('error', { message: 'Error loading booking form' });
  }
});

// Handle booking creation
router.post('/create', requireAuth, requirePermission('manage_bookings'), createBookingValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const customers = await Customer.findAll({ order: [['first_name', 'ASC']] });
    const vehicles = await Vehicle.findAll({ where: { status: 'available' } });
    return res.render('bookings/create', {
      customers,
      vehicles,
      user: req.user,
      error: errors.array()[0].msg,
    });
  }

  try {
    const { customer_id, vehicle_id, start_date, end_date, pickup_time, return_time, deposit_paid } = req.body;
    
    // Check for overlapping bookings for the selected vehicle
    const conflicting = await Booking.findOne({
      where: {
        vehicle_id,
        status: { [Op.in]: ['confirmed', 'checked-out'] },
        [Op.or]: [
          { start_date: { [Op.between]: [start_date, end_date] } },
          { end_date: { [Op.between]: [start_date, end_date] } },
          { start_date: { [Op.lte]: start_date }, end_date: { [Op.gte]: end_date } }
        ]
      }
    });
    
    if (conflicting) {
      const customers = await Customer.findAll({ order: [['first_name', 'ASC']] });
      const vehicles = await Vehicle.findAll({ where: { status: 'available' } });
      return res.render('bookings/create', {
        customers,
        vehicles,
        user: req.user,
        error: 'Vehicle is not available for the selected dates. Please choose another vehicle or dates.'
      });
    }
    
    // Calculate rental duration in days
    const start = new Date(start_date);
    const end = new Date(end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // Get vehicle rate
    const vehicle = await Vehicle.findByPk(vehicle_id);
    const dailyRate = parseFloat(vehicle.daily_rate);
    const totalAmount = days * dailyRate;
    
    // Parse deposit amount
    const depositAmount = parseFloat(deposit_paid) || 0;
    const balanceDue = totalAmount - depositAmount;

    // Create booking
    const booking = await Booking.create({
      customer_id,
      vehicle_id,
      start_date,
      end_date,
      pickup_time,
      return_time,
      created_by: req.user.id,
      total_amount: totalAmount,
      deposit_paid: depositAmount,
      balance_due: balanceDue,
      status: 'confirmed'
    });

    // If deposit was paid, record it as a payment
    if (depositAmount > 0) {
      await Payment.create({
        booking_id: booking.booking_id,
        amount: depositAmount,
        method: 'cash',
        reference: `DEP-${booking.booking_reference}`,
        status: 'completed',
        recorded_by: req.user.id,
        notes: 'Initial deposit at booking creation'
      });
    }
    
    // Update vehicle status to reserved
    await vehicle.update({ status: 'reserved' });

    // Log activity
    await logActivity(req.user, 'create', 'booking', booking.booking_id, `Created booking ${booking.booking_reference} for vehicle ${vehicle.registration}`);

    // Send email notification to customer (if customer has user account)
    try {
      const customer = await Customer.findByPk(customer_id);
      if (customer && customer.email) {
        const user = await User.findOne({ where: { email: customer.email } });
        if (user) {
          await sendBookingConfirmation(user, booking, vehicle);
        }
      }
    } catch (emailError) {
      console.error('Error sending booking confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    res.redirect('/bookings');
  } catch (error) {
    console.error('Error creating booking:', error);
    const customers = await Customer.findAll();
    const vehicles = await Vehicle.findAll({ where: { status: 'available' } });
    res.render('bookings/create', {
      customers,
      vehicles,
      user: req.user,
      error: 'Error creating booking. Please try again.'
    });
  }
});

// Check out vehicle (change status from confirmed to checked-out)
router.post('/:id/checkout', requireAuth, requirePermission('manage_bookings'), checkoutValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('error', { message: errors.array()[0].msg });
  }

  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: ['vehicle', 'customer']
    });

    if (!booking) {
      return res.status(404).render('error', { message: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).render('error', { message: 'Booking must be confirmed before checking out' });
    }

    const { check_out_mileage, check_out_fuel, check_out_notes } = req.body;
    const mileage = parseInt(check_out_mileage, 10);
    if (mileage < (booking.vehicle.current_mileage || 0)) {
      return res.status(400).render('error', {
        message: `Checkout mileage must be at least ${booking.vehicle.current_mileage || 0} km (current vehicle mileage)`,
      });
    }

    // Update booking with checkout details
    await booking.update({
      actual_pickup_time: new Date(),
      check_out_mileage: parseInt(check_out_mileage, 10) || 0,
      check_out_fuel: check_out_fuel ? parseInt(check_out_fuel, 10) : null,
      check_out_notes: check_out_notes,
      status: 'checked-out'
    });

    // Update vehicle status to on-rent
    await booking.vehicle.update({
      status: 'on-rent',
      current_mileage: parseInt(check_out_mileage, 10) || booking.vehicle.current_mileage,
      current_fuel: check_out_fuel ? parseInt(check_out_fuel, 10) : booking.vehicle.current_fuel
    });

    // Log activity
    await logActivity(req.user, 'checkout', 'booking', booking.booking_id, `Checked out booking ${booking.booking_reference} for vehicle ${booking.vehicle.registration}`);

    res.redirect('/bookings');
  } catch (error) {
    console.error('Error checking out vehicle:', error);
    res.status(500).render('error', { message: 'Error checking out vehicle' });
  }
});

// Return vehicle (complete booking)
router.post('/:id/return', requireAuth, requirePermission('manage_bookings'), returnValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('error', { message: errors.array()[0].msg });
  }

  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: ['vehicle', 'customer']
    });

    if (!booking) {
      return res.status(404).render('error', { message: 'Booking not found' });
    }

    if (booking.status !== 'checked-out') {
      return res.status(400).render('error', { message: 'Vehicle must be checked out before returning' });
    }

    const { check_in_mileage, check_in_fuel, check_in_notes, damage_charges, fuel_charges, late_fee } = req.body;
    const returnMileage = parseInt(check_in_mileage, 10);
    const checkoutMileage = booking.check_out_mileage || booking.vehicle.current_mileage || 0;
    if (returnMileage < checkoutMileage) {
      return res.status(400).render('error', {
        message: `Return mileage must be at least ${checkoutMileage} km (checkout mileage)`,
      });
    }

    const additionalCharges =
      (parseFloat(damage_charges) || 0) +
      (parseFloat(fuel_charges) || 0) +
      (parseFloat(late_fee) || 0);
    const newTotal = parseFloat(booking.total_amount || 0) + additionalCharges;
    const newBalance = newTotal - parseFloat(booking.deposit_paid || 0);

    // Update booking with return details
    await booking.update({
      actual_return_time: new Date(),
      check_in_mileage: parseInt(check_in_mileage, 10),
      check_in_fuel: check_in_fuel ? parseInt(check_in_fuel, 10) : null,
      check_in_notes: check_in_notes,
      damage_charges: parseFloat(damage_charges) || 0,
      fuel_charges: parseFloat(fuel_charges) || 0,
      late_fee: parseFloat(late_fee) || 0,
      total_amount: newTotal,
      balance_due: newBalance,
      status: 'completed'
    });

    // Update vehicle status to available
    await booking.vehicle.update({
      status: 'available',
      current_mileage: parseInt(check_in_mileage, 10) || booking.vehicle.current_mileage,
      current_fuel: check_in_fuel ? parseInt(check_in_fuel, 10) : booking.vehicle.current_fuel
    });

    // Log activity
    await logActivity(req.user, 'return', 'booking', booking.booking_id, `Returned vehicle for booking ${booking.booking_reference}`);

    // Send invoice to customer via email
    try {
      const invoiceData = await generateInvoiceData(booking.booking_id);
      const customerEmail = booking.customer?.email;
      const customerName = booking.customer
        ? `${booking.customer.first_name} ${booking.customer.last_name}`
        : 'Customer';
      if (customerEmail) {
        await sendInvoiceEmail(customerEmail, customerName, invoiceData);
      }
    } catch (emailError) {
      console.error('Error sending invoice email:', emailError);
    }

    res.redirect('/bookings');
  } catch (error) {
    console.error('Error returning vehicle:', error);
    res.status(500).render('error', { message: 'Error returning vehicle' });
  }
});

// Delete booking (cancel)
router.post('/:id/delete', requireAuth, requirePermission('manage_bookings'), async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: ['vehicle', 'customer']
    });

    if (!booking) {
      return res.status(404).render('error', { message: 'Booking not found' });
    }

    // Only allow deletion of confirmed bookings (not checked-out or completed)
    if (booking.status !== 'confirmed') {
      return res.status(400).render('error', { message: 'Cannot delete booking that has already been checked out or completed' });
    }

    // Update vehicle status back to available
    await booking.vehicle.update({ status: 'available' });

    // Log activity before deletion
    await logActivity(req.user, 'delete', 'booking', booking.booking_id, `Cancelled booking ${booking.booking_reference} for vehicle ${booking.vehicle.registration}`);

    // Delete the booking
    await booking.destroy();

    res.redirect('/bookings');
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).render('error', { message: 'Error deleting booking' });
  }
});

module.exports = router;