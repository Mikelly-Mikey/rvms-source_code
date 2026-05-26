const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { Booking, Customer, Vehicle, Payment, User } = require('../models');
const { Op } = require('sequelize');
const { logActivity } = require('../utils/activityLogger');
const { body } = require('express-validator');
const { sendBookingConfirmation } = require('../utils/emailService');

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
  body('check_out_fuel').optional().isIn(['full', '3/4', '1/2', '1/4', 'empty']).withMessage('Valid fuel level is required'),
  body('check_out_notes').optional().trim(),
];

const returnValidation = [
  body('check_in_mileage').isFloat({ min: 0 }).withMessage('Valid mileage is required'),
  body('check_in_fuel').optional().isIn(['full', '3/4', '1/2', '1/4', 'empty']).withMessage('Valid fuel level is required'),
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
    res.render('bookings/create', { customers, vehicles, user: req.user, error: null });
  } catch (error) {
    console.error('Error loading booking form:', error);
    res.status(500).render('error', { message: 'Error loading booking form' });
  }
});

// Handle booking creation
router.post('/create', requireAuth, requirePermission('manage_bookings'), createBookingValidation, async (req, res) => {
  try {
    const { customer_id, vehicle_id, start_date, end_date, pickup_time, return_time } = req.body;
    
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
      deposit_paid: 0,
      balance_due: totalAmount,
      status: 'confirmed'
    });
    
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
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: ['vehicle']
    });

    if (!booking) {
      return res.status(404).render('error', { message: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).render('error', { message: 'Booking must be confirmed before checking out' });
    }

    const { check_out_mileage, check_out_fuel, check_out_notes } = req.body;

    // Update booking with checkout details
    await booking.update({
      actual_pickup_time: new Date(),
      check_out_mileage: check_out_mileage || 0,
      check_out_fuel: check_out_fuel || 'full',
      check_out_notes: check_out_notes,
      status: 'checked-out'
    });

    // Update vehicle status to on-rent
    await booking.vehicle.update({
      status: 'on-rent',
      current_mileage: check_out_mileage || booking.vehicle.current_mileage,
      current_fuel: check_out_fuel || booking.vehicle.current_fuel
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
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: ['vehicle']
    });

    if (!booking) {
      return res.status(404).render('error', { message: 'Booking not found' });
    }

    if (booking.status !== 'checked-out') {
      return res.status(400).render('error', { message: 'Vehicle must be checked out before returning' });
    }

    const { check_in_mileage, check_in_fuel, check_in_notes, damage_charges, fuel_charges, late_fee } = req.body;

    // Update booking with return details
    await booking.update({
      actual_return_time: new Date(),
      check_in_mileage: check_in_mileage || booking.check_in_mileage,
      check_in_fuel: check_in_fuel || booking.check_in_fuel,
      check_in_notes: check_in_notes,
      damage_charges: damage_charges || 0,
      fuel_charges: fuel_charges || 0,
      late_fee: late_fee || 0,
      status: 'completed'
    });

    // Update vehicle status to available
    await booking.vehicle.update({
      status: 'available',
      current_mileage: check_in_mileage || booking.vehicle.current_mileage,
      current_fuel: check_in_fuel || booking.vehicle.current_fuel
    });

    // Log activity
    await logActivity(req.user, 'return', 'booking', booking.booking_id, `Returned vehicle for booking ${booking.booking_reference}`);

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
      include: ['vehicle']
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