/**
 * CONTROLADOR DE AVALIAÇÕES (Reviews)
 * * Gere o sistema de feedback. Permite que clientes avaliem serviços concluídos
 * e que administradores moderem esses comentários.
 * * @module controllers/reviewController
 */

const Review = require('../models/Review');
const Booking = require('../models/Booking');

/**
 * CRIAR AVALIAÇÃO
 * * Permite ao cliente avaliar um serviço.
 * * Regras de Negócio:
 * * 1. Apenas clientes podem avaliar.
 * * 2. A marcação deve existir e pertencer ao cliente.
 * * 3. O estado da marcação deve ser 'completed'.
 * * 4. Não permite duplicidade (uma avaliação por marcação).
 * * @param req - Body com workshopId, bookingId, rating (1-5) e comment
 * @param res - Retorna a avaliação criada
 */
exports.createReview = async (req, res) => {
  try {
    const { workshopId, bookingId, rating, comment } = req.body;

    // Verificar se é cliente
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Apenas clientes podem avaliar' });
    }

    // Se houver bookingId, verificar integridade
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: 'Marcação não encontrada' });
      }

      if (booking.customer.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Sem permissão' });
      }

      // Regra Crítica: Serviço tem de estar acabado
      if (booking.status !== 'completed') {
        return res.status(400).json({ message: 'Só pode avaliar após serviço concluído' });
      }

      // Evitar spam/avaliações duplicadas
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

/**
 * OBTER AVALIAÇÕES DA OFICINA (Público)
 * * Lista as avaliações visíveis de uma oficina e calcula a média de estrelas.
 * * @param req - workshopId nos parâmetros da URL
 */
exports.getReviewsByWorkshop = async (req, res) => {
  try {
    const reviews = await Review.find({ 
      workshop: req.params.workshopId,
      visible: true // Apenas mostra as que não foram ocultadas pelo admin
    })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    // Cálculo da Média (Average Rating)
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

/**
 * MINHAS AVALIAÇÕES (Cliente)
 * * Histórico de feedback dado pelo cliente logado.
 */
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

/**
 * MODERAR AVALIAÇÃO (Admin Only)
 * * Permite ao dono da oficina ocultar comentários ofensivos ou impróprios.
 * * Não apaga o registo, apenas muda a flag 'visible'.
 */
exports.updateReviewVisibility = async (req, res) => {
  try {
    const { visible } = req.body;
    
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }

    // Verificar se o admin é dono da oficina avaliada
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

/**
 * APAGAR AVALIAÇÃO
 * * Permissões Híbridas:
 * * 1. O Cliente pode apagar a sua própria avaliação.
 * * 2. O Admin da oficina pode apagar avaliações da sua oficina.
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }

    // Lógica de Permissões
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