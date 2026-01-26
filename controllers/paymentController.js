const Booking = require('../models/Booking');
const { validateNIF } = require('../utils/helpers');

/**
 * Simulate payment processing (Development mode)
 * In production, this would integrate with Stripe, MBWay, or Multibanco
 * NOW ALSO GENERATES INVOICE
 */
exports.simulatePayment = async (req, res) => {
  try {
    const { bookingId, paymentMethod, customerNif } = req.body;

    // Validate booking exists and belongs to user
    const booking = await Booking.findById(bookingId)
      .populate('service')
      .populate('workshop')
      .populate('vehicle')
      .populate('customer', 'name email nif phone');

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Check if user owns this booking
    if (booking.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ 
        message: 'Apenas marcações concluídas podem ser pagas',
        currentStatus: booking.status
      });
    }

    // Check if already paid
    if (booking.paid || booking.paymentStatus === 'paid') {
      return res.status(400).json({ 
        message: 'Esta marcação já foi paga',
        paidAt: booking.paidAt
      });
    }

    // Validate NIF if provided
    if (customerNif && !validateNIF(customerNif)) {
      return res.status(400).json({
        message: 'NIF inválido. O NIF deve ter 9 dígitos e ser válido.'
      });
    }

    // Simulate payment processing (always succeeds in dev mode)
    // In production, this would call the actual payment gateway
    console.log(`[PAYMENT] Processando pagamento de €${booking.finalPrice || booking.estimatedPrice}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mark as paid
    booking.paid = true;
    booking.paymentStatus = 'paid';
    booking.paymentMethod = paymentMethod || 'simulated';
    booking.paidAt = new Date();
    if (customerNif) {
      booking.customerNif = customerNif;
    }

    await booking.save();

    // Generate invoice after payment
    const invoice = generateInvoiceData(booking);

    // Return success with booking details
    res.json({
      success: true,
      message: 'Pagamento processado com sucesso',
      payment: {
        bookingId: booking._id,
        amount: booking.finalPrice || booking.estimatedPrice || booking.service?.price || 0,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        paidAt: booking.paidAt,
        hasNif: !!booking.customerNif,
        workshop: booking.workshop?.name,
        service: booking.service?.name
      },
      invoice
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
 * Generate invoice data
 * Creates invoice object after payment
 */
function generateInvoiceData(booking) {
  const basePrice = booking.finalPrice || booking.estimatedPrice || booking.service.price;
  const vatRate = 23; // 23% VAT in Portugal
  const vatAmount = (basePrice * vatRate) / 100;
  const totalAmount = basePrice + vatAmount;

  const invoice = {
    invoiceNumber: `INV-${Date.now()}-${booking._id.toString().slice(-6).toUpperCase()}`,
    invoiceDate: new Date(),
    bookingId: booking._id,
    
    workshop: {
      name: booking.workshop.name,
      nif: booking.workshop.nif,
      address: booking.workshop.address,
      city: booking.workshop.city,
      postalCode: booking.workshop.postalCode,
      contact: booking.workshop.contact
    },
    
    customer: {
      name: booking.customer.name,
      email: booking.customer.email,
      nif: booking.customerNif || booking.customer.nif || 'N/A',
      phone: booking.customer.phone
    },
    
    vehicle: {
      brand: booking.vehicle.brand,
      model: booking.vehicle.model,
      licensePlate: booking.vehicle.licensePlate,
      year: booking.vehicle.year
    },
    
    service: {
      name: booking.service.name,
      description: booking.service.publicDescription,
      date: booking.startTime,
      duration: booking.service.durationMinutes
    },
    
    pricing: {
      basePrice: Math.round(basePrice * 100) / 100,
      vatRate: vatRate,
      vatAmount: Math.round(vatAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    },
    
    paymentStatus: 'paid',
    paymentMethod: booking.paymentMethod,
    paidAt: booking.paidAt
  };

  console.log(`[INVOICE] Fatura gerada: ${invoice.invoiceNumber}`);
  
  return invoice;
}

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
      .populate('workshop')
      .populate('vehicle')
      .populate('customer', 'name email nif phone');

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    if (booking.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ 
        message: 'Apenas marcações concluídas podem ser pagas',
        currentStatus: booking.status
      });
    }

    // Check if already paid
    if (booking.paid || booking.paymentStatus === 'paid') {
      return res.status(400).json({ 
        message: 'Esta marcação já foi paga',
        paidAt: booking.paidAt
      });
    }

    // Validate NIF if provided
    if (customerNif && !validateNIF(customerNif)) {
      return res.status(400).json({
        message: 'NIF inválido. O NIF deve ter 9 dígitos e ser válido.'
      });
    }

    // In production, integrate with Stripe here:
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: (booking.finalPrice || booking.estimatedPrice) * 100, // Stripe uses cents
    //   currency: 'eur',
    //   payment_method: paymentMethodId,
    //   confirm: true
    // });

    // For now, simulate success
    booking.paid = true;
    booking.paymentStatus = 'paid';
    booking.paymentMethod = 'card';
    booking.paidAt = new Date();
    if (customerNif) {
      booking.customerNif = customerNif;
    }

    await booking.save();

    // Generate invoice
    const invoice = generateInvoiceData(booking);

    res.json({
      success: true,
      message: 'Pagamento processado com sucesso',
      payment: {
        bookingId: booking._id,
        amount: booking.finalPrice || booking.estimatedPrice || booking.service?.price || 0,
        paymentStatus: booking.paymentStatus,
        paidAt: booking.paidAt
      },
      invoice
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
      .select('paymentStatus paymentMethod paidAt customerNif service paid');

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Check permissions
    if (booking.customer?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    res.json({
      bookingId: booking._id,
      paid: booking.paid,
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
