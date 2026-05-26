const { User } = require('../models');
const { body, validationResult } = require('express-validator');

const loginView = (req, res) => {
  res.render('auth/login', { 
    error: req.query.error,
    message: req.query.message 
  });
};

const adminLoginView = (req, res) => {
  res.render('auth/admin_login', { 
    error: req.query.error,
    message: req.query.message 
  });
};

const registerView = (req, res) => {
  res.render('auth/register', { 
    error: req.query.error 
  });
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.redirect('/login?error=' + encodeURIComponent(errors.array()[0].msg));
  }

  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.redirect('/login?error=Invalid username or password');
    }

    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.redirect('/login?error=Invalid username or password');
    }

    if (!user.is_active) {
      return res.redirect('/login?error=Your account is inactive. Please contact administrator.');
    }

    // Update last login timestamp
    await user.update({ last_login: new Date() });

    req.session.userId = user.id;
    req.session.userRole = user.role;

    // Redirect based on user role
    if (user.role === 'customer') {
      return res.redirect('/customer-dashboard');
    } else if (user.role === 'admin') {
      return res.redirect('/'); // Will route to admin-dashboard
    } else {
      return res.redirect('/'); // Fleet supervisor, receptionist, mechanic -> dashboard
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.redirect('/login?error=An error occurred during login');
  }
};

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.redirect('/admin/login?error=Invalid username or password');
    }
    
    const isValidPassword = await user.validatePassword(password);
    
    if (!isValidPassword) {
      return res.redirect('/admin/login?error=Invalid username or password');
    }
    
    if (!user.is_active) {
      return res.redirect('/admin/login?error=Your account is inactive. Please contact administrator.');
    }
    
    // Check if user is staff
    const staffRoles = ['admin', 'fleet_supervisor', 'receptionist', 'mechanic'];
    if (!staffRoles.includes(user.role)) {
      return res.redirect('/admin/login?error=Access denied. This login is for staff only.');
    }
    
    req.session.userId = user.id;
    req.session.userRole = user.role;
    
    return res.redirect('/');
  } catch (error) {
    console.error('Admin login error:', error);
    return res.redirect('/admin/login?error=An error occurred during login');
  }
};

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.redirect('/register?error=' + encodeURIComponent(errors.array()[0].msg));
  }

  try {
    const { username, email, password, first_name, last_name, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.redirect('/register?error=Username or email already exists');
    }

    const user = await User.create({
      username,
      email,
      password,
      first_name,
      last_name,
      phone,
      role: 'customer'
    });

    return res.redirect('/login?message=Account created successfully! Please log in.');
  } catch (error) {
    console.error('Registration error:', error);
    return res.redirect('/register?error=An error occurred during registration');
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
};

module.exports = {
  loginView,
  adminLoginView,
  registerView,
  login,
  adminLogin,
  register,
  logout
};
