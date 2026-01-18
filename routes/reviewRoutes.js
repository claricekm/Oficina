const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/reviews/workshop/:workshopId - Get reviews of workshop (public)
router.get('/workshop/:workshopId', reviewController.getReviewsByWorkshop);

// GET /api/reviews/my - Get my reviews (customer)
router.get('/my', authMiddleware, reviewController.getMyReviews);

// POST /api/reviews - Create review (customer)
router.post('/', authMiddleware, reviewController.createReview);

// PUT /api/reviews/:id/visibility - Update visibility (admin)
router.put('/:id/visibility', authMiddleware, reviewController.updateReviewVisibility);

// DELETE /api/reviews/:id - Delete review
router.delete('/:id', authMiddleware, reviewController.deleteReview);

module.exports = router;
