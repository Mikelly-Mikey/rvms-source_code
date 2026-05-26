const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { Review, Vehicle, User } = require('../models');
const { body, validationResult } = require('express-validator');

// Validation rules
const createReviewValidation = [
  body('vehicle_id').isInt().withMessage('Valid vehicle ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ min: 10, max: 500 }).withMessage('Comment must be between 10 and 500 characters'),
];

// Create review (customer only)
router.post('/create', requireAuth, createReviewValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.redirect(`/vehicles/${req.body.vehicle_id}?error=${encodeURIComponent(errors.array()[0].msg)}`);
  }

  try {
    const { vehicle_id, rating, comment } = req.body;

    // Check if user has already reviewed this vehicle
    const existingReview = await Review.findOne({
      where: {
        vehicle_id,
        user_id: req.user.id
      }
    });

    if (existingReview) {
      return res.redirect(`/vehicles/${vehicle_id}?error=You have already reviewed this vehicle`);
    }

    // Check if user has a completed booking for this vehicle
    // This is a basic check - you might want to add more sophisticated validation
    const { Booking } = require('../models');
    const hasBooked = await Booking.findOne({
      where: {
        user_id: req.user.id,
        vehicle_id,
        status: 'completed'
      }
    });

    if (!hasBooked) {
      return res.redirect(`/vehicles/${vehicle_id}?error=You can only review vehicles you have rented`);
    }

    await Review.create({
      vehicle_id,
      user_id: req.user.id,
      rating,
      comment,
      is_approved: false // Reviews need admin approval
    });

    res.redirect(`/vehicles/${vehicle_id}?message=Review submitted! It will be visible after approval.`);
  } catch (error) {
    console.error('Error creating review:', error);
    res.redirect(`/vehicles/${req.body.vehicle_id}?error=Error submitting review`);
  }
});

// Get vehicle reviews (public)
router.get('/vehicle/:vehicleId', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: {
        vehicle_id: req.params.vehicleId,
        is_approved: true
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

// Admin: List pending reviews
router.get('/pending', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).render('error', { message: 'Access denied' });
  }

  try {
    const pendingReviews = await Review.findAll({
      where: { is_approved: false },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['make', 'model', 'registration']
        },
        {
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.render('reviews/pending', { reviews: pendingReviews, user: req.user });
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).render('error', { message: 'Error fetching reviews' });
  }
});

// Admin: Approve review
router.post('/:id/approve', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).render('error', { message: 'Access denied' });
  }

  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).render('error', { message: 'Review not found' });
    }

    await review.update({ is_approved: true });
    res.redirect('/reviews/pending');
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).render('error', { message: 'Error approving review' });
  }
});

// Admin: Delete review
router.post('/:id/delete', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).render('error', { message: 'Access denied' });
  }

  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).render('error', { message: 'Review not found' });
    }

    await review.destroy();
    res.redirect('/reviews/pending');
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).render('error', { message: 'Error deleting review' });
  }
});

module.exports = router;
