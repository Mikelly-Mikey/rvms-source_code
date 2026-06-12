const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const { User } = require('../models');
const { sendVerificationEmail, sendSms } = require('../utils/emailService');
const { requireAuth } = require('../middleware/auth');

// Rate limiting map for verification requests (in-memory, use Redis in production)
const verificationRateLimits = new Map();

// Helper to check rate limit (max 3 requests per 15 minutes per user)
function checkVerificationRateLimit(userId) {
  const now = Date.now();
  const key = `verify_${userId}`;
  const limit = verificationRateLimits.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  
  if (now > limit.resetAt) {
    // Reset the limit
    limit.count = 0;
    limit.resetAt = now + 15 * 60 * 1000;
  }
  
  if (limit.count >= 3) {
    return false; // Rate limit exceeded
  }
  
  limit.count += 1;
  verificationRateLimits.set(key, limit);
  return true;
}

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Valid phone number is required'),
];

router.get('/login', authController.loginView);
router.post('/login', loginValidation, authController.login);
router.get('/admin/login', authController.adminLoginView);
router.post('/admin/login', loginValidation, authController.adminLogin);
router.get('/register', authController.registerView);
router.post('/register', registerValidation, authController.register);
router.get('/logout', authController.logout);

// SECURE: Send verification token - requires authentication and ownership check
router.post('/auth/send-verification/:userId', requireAuth, async (req, res) => {
  try {
    const requestedUserId = parseInt(req.params.userId, 10);
    
    // SECURITY: Only allow users to request verification for their own account
    // or admins to request for any account
    if (req.user.id !== requestedUserId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check rate limit
    if (!checkVerificationRateLimit(requestedUserId)) {
      return res.status(429).json({ 
        error: 'Too many verification requests. Please try again in 15 minutes.' 
      });
    }
    
    const user = await User.findByPk(requestedUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't send if already verified
    if (user.is_email_verified) {
      return res.json({ success: true, message: 'Email already verified' });
    }
    
    const token = await user.generateEmailVerificationToken();
    
    try {
      await sendVerificationEmail(user, token);
      if (user.phone) {
        // Only send first 6 chars of token via SMS for security
        await sendSms(user.phone, `Your RVMS verification code: ${token.substring(0, 8).toUpperCase()}`);
      }
    } catch (err) {
      console.warn('Failed sending verification channels:', err.message);
      // Don't expose internal errors to client
      return res.status(500).json({ error: 'Failed to send verification. Please try again later.' });
    }
    
    return res.json({ success: true, message: 'Verification token sent' });
  } catch (err) {
    console.error('send-verification error:', err);
    return res.status(500).json({ error: 'Failed to send verification' });
  }
});

// SECURE: Verify email via GET link (with token in query)
router.get('/auth/verify-email', async (req, res) => {
  try {
    const { userId, token } = req.query;
    
    if (!userId || !token) {
      return res.redirect('/login?error=' + encodeURIComponent('Invalid verification link'));
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.redirect('/login?error=' + encodeURIComponent('User not found'));
    }
    
    const ok = await user.verifyEmailToken(token);
    if (!ok) {
      // Check if it's due to expiry or attempts
      if (user.email_verification_expires && new Date() > user.email_verification_expires) {
        return res.redirect('/login?error=' + encodeURIComponent('Verification token expired. Please request a new one.'));
      } else if (user.email_verification_attempts >= 5) {
        return res.redirect('/login?error=' + encodeURIComponent('Too many failed attempts. Please request a new verification token.'));
      }
      return res.redirect('/login?error=' + encodeURIComponent('Invalid verification token'));
    }
    
    return res.redirect('/login?message=' + encodeURIComponent('Email verified successfully. You can now log in.'));
  } catch (err) {
    console.error('verify-email GET error:', err);
    return res.redirect('/login?error=' + encodeURIComponent('Verification failed'));
  }
});

// SECURE: Verify email via POST (for API/AJAX calls)
router.post('/auth/verify-email', async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    if (!userId || !token) {
      return res.status(400).json({ error: 'userId and token required' });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const ok = await user.verifyEmailToken(token);
    if (!ok) {
      // Provide specific error messages
      if (user.email_verification_expires && new Date() > user.email_verification_expires) {
        return res.status(400).json({ error: 'Token expired. Please request a new one.' });
      } else if (user.email_verification_attempts >= 5) {
        return res.status(429).json({ error: 'Too many failed attempts. Please request a new token.' });
      }
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    try {
      if (user.phone) {
        await sendSms(user.phone, 'Your RVMS account has been verified. Thank you!');
      }
    } catch (e) {
      // Ignore notification failures
      console.warn('Failed to send verification confirmation SMS:', e.message);
    }
    
    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    console.error('verify-email POST error:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
