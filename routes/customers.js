const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { Customer } = require('../models');
const { body } = require('express-validator');

// Validation rules
const createCustomerValidation = [
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('id_type').isIn(['national_id', 'passport', 'alien_card']).withMessage('Valid ID type is required'),
  body('id_number').trim().notEmpty().withMessage('ID number is required'),
  body('license_number').optional().trim(),
  body('license_expiry').optional().isISO8601().withMessage('Valid license expiry date is required'),
];

router.get('/', requireAuth, requirePermission('manage_bookings'), async (req, res) => {
  const customers = await Customer.findAll({ order: [['date_registered', 'DESC']] });
  res.render('customers/list', { customers, user: req.user });
});

router.get('/create', requireAuth, (req, res) => {
  res.render('customers/create', { user: req.user, error: null });
});

router.post('/create', requireAuth, createCustomerValidation, async (req, res) => {
  try {
    console.log('Creating customer with data:', req.body);
    const { first_name, last_name, phone, email, id_type, id_number, license_number, license_expiry } = req.body;
    
    const customer = await Customer.create({
      first_name,
      last_name,
      phone,
      email: email || null,
      id_type,
      id_number,
      license_number,
      license_expiry,
      registered_by: req.user.id
    });
    
    console.log('Customer created successfully:', customer.customer_id);
    res.redirect('/customers');
  } catch (error) {
    console.error('Error creating customer:', error);
    res.render('customers/create', { user: req.user, error: error.message });
  }
});

router.post('/:id/blacklist', requireAuth, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (customer) {
      await customer.update({ is_blacklisted: true });
    }
    res.redirect('/customers');
  } catch (error) {
    console.error('Error blacklisting customer:', error);
    res.redirect('/customers');
  }
});

router.post('/:id/unblacklist', requireAuth, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (customer) {
      await customer.update({ is_blacklisted: false });
    }
    res.redirect('/customers');
  } catch (error) {
    console.error('Error unblacklisting customer:', error);
    res.redirect('/customers');
  }
});

router.post('/:id/delete', requireAuth, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (customer) {
      await customer.destroy();
    }
    res.redirect('/customers');
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.redirect('/customers');
  }
});

module.exports = router;
