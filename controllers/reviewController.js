const Review = require('../models/Review');
const Booking = require('../models/Booking');

// Create review (customer only, after completed booking)
exports.createReview = async (req, res) => {
  try {
    const { workshopId, bookingId, rating, comment } = req.body;

    // Check if user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Apenas clientes podem avaliar' });
    }

    // If bookingId provided, verify it's completed and belongs to user
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: 'Marcação não encontrada' });
      }

      if (booking.customer.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Sem permissão' });
      }

      if (booking.status !== 'completed') {
        return res.status(400).json({ message: 'Só pode avaliar após serviço concluído' });
      }

      // Check if already reviewed
      const existingReview = await Review.findOne({ booking: bookingId });
      if (existingReview) {
        return res.status(400).json({ message: 'Já avaliou esta marcação' });
      }
    }

    const review = await Review.create({
      workshop: workshopId,
      customer: req.user.id,
      booking: bookingId || null,
      rating,
      comment
    });

    const populatedReview = await Review.findById(review._id)
      .populate('customer', 'name')
      .populate('workshop', 'name');

    res.status(201).json({
      message: 'Avaliação criada com sucesso',
      review: populatedReview
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get reviews by workshop
exports.getReviewsByWorkshop = async (req, res) => {
  try {
    const reviews = await Review.find({ 
      workshop: req.params.workshopId,
      visible: true 
    })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      reviews,
      totalReviews: reviews.length,
      averageRating: avgRating.toFixed(1)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my reviews (customer)
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ customer: req.user.id })
      .populate('workshop', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update review visibility (admin only)
exports.updateReviewVisibility = async (req, res) => {
  try {
    const { visible } = req.body;
    
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }

    // Check if user is admin of this workshop
    if (req.user.role !== 'admin' || review.workshop.toString() !== req.user.workshop) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    review.visible = visible;
    await review.save();

    res.json({
      message: visible ? 'Avaliação tornada visível' : 'Avaliação ocultada',
      review
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete review (customer own review or admin)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }

    // Check permissions
    const canDelete = 
      req.user.role === 'customer' && review.customer.toString() === req.user.id ||
      req.user.role === 'admin' && review.workshop.toString() === req.user.workshop;

    if (!canDelete) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    await review.deleteOne();

    res.json({ message: 'Avaliação apagada' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
