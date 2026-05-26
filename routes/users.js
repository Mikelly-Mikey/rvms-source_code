const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { User } = require('../models');

router.get('/', requireAuth, requirePermission('manage_users'), async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['date_joined', 'DESC']]
    });
    res.render('users/list', { users, user: req.user });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).render('error', { message: 'Error fetching users' });
  }
});

module.exports = router;
