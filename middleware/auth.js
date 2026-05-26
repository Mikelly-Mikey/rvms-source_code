const { User } = require('../models');

const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  
  try {
    const user = await User.findByPk(req.session.userId);
    if (!user || !user.is_active) {
      req.session.destroy();
      return res.redirect('/login');
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.redirect('/login');
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/login');
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).render('error', { 
        message: 'Access denied. You do not have permission to access this page.' 
      });
    }
    
    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/login');
    }
    
    if (!req.user.hasPermission(permission)) {
      return res.status(403).render('error', { 
        message: 'Access denied. You do not have permission to perform this action.' 
      });
    }
    
    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
  requirePermission
};
