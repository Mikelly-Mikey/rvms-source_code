const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { User } = require('../models');
const { body, validationResult } = require('express-validator');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');

const STAFF_ROLES = ['admin', 'fleet_supervisor', 'receptionist', 'mechanic'];

const createUserValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('role').isIn(STAFF_ROLES).withMessage('Valid staff role is required'),
  body('phone').optional().trim(),
];

// SECURE: Staff management restricted to admin only
router.get('/', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: { [Op.in]: STAFF_ROLES } },
      order: [['date_joined', 'DESC']],
      // Include email and phone for admin view, but exclude sensitive tokens
      attributes: { exclude: ['password', 'email_verification_token', 'password_reset_token', 'email_verification_expires', 'email_verification_attempts'] },
    });
    res.render('users/list', { users, user: req.user, error: null, success: req.query.success || null });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).render('error', { message: 'Error fetching users' });
  }
});

router.post('/create', requireAuth, requireRole(['admin']), createUserValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const users = await User.findAll({
      where: { role: { [Op.in]: STAFF_ROLES } },
      order: [['date_joined', 'DESC']],
      attributes: { exclude: ['password', 'email_verification_token', 'password_reset_token', 'email_verification_expires', 'email_verification_attempts'] },
    });
    return res.render('users/list', {
      users,
      user: req.user,
      error: errors.array()[0].msg,
      success: null,
      formData: req.body,
    });
  }

  try {
    const { username, email, password, first_name, last_name, role, phone } = req.body;

    const existing = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
    });
    if (existing) {
      const users = await User.findAll({
        where: { role: { [Op.in]: STAFF_ROLES } },
        order: [['date_joined', 'DESC']],
        attributes: { exclude: ['password', 'email_verification_token', 'password_reset_token', 'email_verification_expires', 'email_verification_attempts'] },
      });
      return res.render('users/list', {
        users,
        user: req.user,
        error: 'Username or email already exists',
        success: null,
        formData: req.body,
      });
    }

    const newUser = await User.create({
      username,
      email,
      password,
      first_name,
      last_name,
      role,
      phone: phone || null,
      is_staff: true,
      is_active: true,
      is_email_verified: true,
    });

    await logActivity(
      req.user,
      'create',
      'user',
      newUser.id,
      `Added staff member ${newUser.getFullName()} (${newUser.role})`
    );

    res.redirect('/users?success=Staff member added successfully');
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).render('error', { message: 'Error creating staff member' });
  }
});

router.post('/:id/delete', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const target = await User.findByPk(req.params.id);
    if (!target) {
      return res.status(404).render('error', { message: 'User not found' });
    }

    if (!STAFF_ROLES.includes(target.role)) {
      return res.status(400).render('error', { message: 'Cannot delete customer accounts from staff management' });
    }

    if (target.id === req.user.id) {
      return res.status(400).render('error', { message: 'You cannot delete your own account' });
    }

    const name = target.getFullName();
    const role = target.role;
    await target.destroy();

    await logActivity(req.user, 'delete', 'user', parseInt(req.params.id, 10), `Removed staff member ${name} (${role})`);

    res.redirect('/users?success=Staff member removed successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).render('error', { message: 'Error deleting staff member' });
  }
});

module.exports = router;
