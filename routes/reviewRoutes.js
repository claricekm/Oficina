const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const { customerOnly, adminOnly } = require('../middleware/rbacMiddleware');

// GET /api/reviews/workshop/:workshopId - Get reviews of workshop (public)
router.get('/workshop/:workshopId', reviewController.getReviewsByWorkshop);

// GET /api/reviews/my - Get my reviews (customer only)
router.get('/my', authMiddleware, customerOnly, reviewController.getMyReviews);

// POST /api/reviews - Create review (customer only)
router.post('/', authMiddleware, customerOnly, reviewController.createReview);

// PUT /api/reviews/:id/visibility - Update visibility (admin only)
router.put('/:id/visibility', authMiddleware, adminOnly, reviewController.updateReviewVisibility);

// DELETE /api/reviews/:id - Delete review (owner or admin - handled in controller)
router.delete('/:id', authMiddleware, reviewController.deleteReview);

module.exports = router;
