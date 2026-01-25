const Booking = require('../models/Booking');
const { validateNIF } = require('../utils/helpers');

/**
 * Simulate payment processing (Development mode)
 * In production, this would integrate with Stripe, MBWay, or Multibanco
 */
exports.simulatePayment = async (req, res) => {
  try {
    const { bookingId, paymentMethod, customerNif } = req.body;

    // Validate booking exists and belongs to user
    const booking = await Booking.findById(bookingId)
      .populate('service')
      .populate('workshop');

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Check if user owns this booking
    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // Check if already paid
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Esta marcação já foi paga' });
    }

    // Validate NIF if provided
    if (customerNif && !validateNIF(customerNif)) {
      return res.status(400).json({
        message: 'NIF inválido. O NIF deve ter 9 dígitos e ser válido.'
      });
    }

    // Simulate payment processing (always succeeds in dev mode)
    // In production, this would call the actual payment gateway

    // Update booking with payment info
    booking.paymentStatus = 'paid';
    booking.paymentMethod = paymentMethod || 'simulated';
    booking.paidAt = new Date();
    if (customerNif) {
      booking.customerNif = customerNif;
    }

    await booking.save();

    // Return success with booking details
    res.json({
      success: true,
      message: 'Pagamento processado com sucesso',
      payment: {
        bookingId: booking._id,
        amount: booking.service?.price || 0,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        paidAt: booking.paidAt,
        hasNif: !!booking.customerNif,
        workshop: booking.workshop?.name,
        service: booking.service?.name
      }
    });

  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    res.status(500).json({
      message: 'Erro ao processar pagamento',
      error: error.message
    });
  }
};

/**
 * Process payment (Stripe-ready placeholder)
 * This endpoint is prepared for Stripe integration
 */
exports.processPayment = async (req, res) => {
  try {
    const { bookingId, paymentMethodId, customerNif } = req.body;

    // Validate booking
    const booking = await Booking.findById(bookingId)
      .populate('service')
      .populate('workshop');

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Esta marcação já foi paga' });
    }

    // Validate NIF if provided
    if (customerNif && !validateNIF(customerNif)) {
      return res.status(400).json({
        message: 'NIF inválido. O NIF deve ter 9 dígitos e ser válido.'
      });
    }

    // In production, integrate with Stripe here:
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: booking.service.price * 100, // Stripe uses cents
    //   currency: 'eur',
    //   payment_method: paymentMethodId,
    //   confirm: true
    // });

    // For now, simulate success
    booking.paymentStatus = 'paid';
    booking.paymentMethod = 'card';
    booking.paidAt = new Date();
    if (customerNif) {
      booking.customerNif = customerNif;
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Pagamento processado com sucesso',
      payment: {
        bookingId: booking._id,
        amount: booking.service?.price || 0,
        paymentStatus: booking.paymentStatus,
        paidAt: booking.paidAt
      }
    });

  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    res.status(500).json({
      message: 'Erro ao processar pagamento',
      error: error.message
    });
  }
};

/**
 * Get payment status for a booking
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('service')
      .select('paymentStatus paymentMethod paidAt customerNif service');

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Check permissions
    if (booking.customer?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    res.json({
      bookingId: booking._id,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      paidAt: booking.paidAt,
      hasNif: !!booking.customerNif,
      amount: booking.service?.price || 0
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
