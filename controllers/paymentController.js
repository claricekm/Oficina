/**
 * CONTROLADOR DE PAGAMENTOS (Payment Controller)
 * * Gere o processamento de pagamentos, simulações para desenvolvimento
 * e consulta de estado de transações.
 * * @module controllers/paymentController
 */

const Booking = require('../models/Booking');
const { validateNIF } = require('../utils/helpers');

/**
 * SIMULAR PAGAMENTO (Dev Mode / Pagamento Manual)
 * * Endpoint usado para marcar uma reserva como paga sem passar por um gateway real.
 * * Ideal para testes ou para registar pagamentos feitos por MBWay/Transferência manual.
 * * Valida se o NIF do cliente é válido antes de fechar a conta.
 * * @param req - Body deve conter bookingId, paymentMethod e opcionalmente customerNif
 * @param res - Retorna confirmação e detalhes do pagamento simulado
 */
exports.simulatePayment = async (req, res) => {
  try {
    const { bookingId, paymentMethod, customerNif } = req.body;

    // Validar existência da marcação e popular dados necessários
    const booking = await Booking.findById(bookingId)
      .populate('service')
      .populate('workshop');

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Segurança: Apenas o dono da marcação pode pagar
    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // Evitar pagamentos duplicados
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Esta marcação já foi paga' });
    }

    // Validação de NIF (Fiscal) se fornecido
    if (customerNif && !validateNIF(customerNif)) {
      return res.status(400).json({
        message: 'NIF inválido. O NIF deve ter 9 dígitos e ser válido.'
      });
    }

    // --- LÓGICA DE SIMULAÇÃO ---
    // Em produção, aqui chamaria a API do banco.
    
    // Atualizar estado para PAGO
    booking.paymentStatus = 'paid';
    booking.paymentMethod = paymentMethod || 'simulated';
    booking.paidAt = new Date();
    
    // Guardar NIF na fatura se o cliente pediu
    if (customerNif) {
      booking.customerNif = customerNif;
    }

    await booking.save();

    // Retornar recibo digital
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
 * PROCESSAR PAGAMENTO REAL (Integração Futura Stripe)
 * * Estrutura preparada para receber tokens de pagamento (Stripe Payment Intents).
 * * Atualmente funciona como placeholder, mas contém as validações de segurança
 * necessárias para quando o gateway for ativado.
 * * @param req - Body espera paymentMethodId (Token do cartão)
 * @param res - Confirmação da transação
 */
exports.processPayment = async (req, res) => {
  try {
    const { bookingId, paymentMethodId, customerNif } = req.body;

    // Validações de Segurança e Integridade
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

    // Validação Fiscal
    if (customerNif && !validateNIF(customerNif)) {
      return res.status(400).json({
        message: 'NIF inválido. O NIF deve ter 9 dígitos e ser válido.'
      });
    }

    /* TODO: Integração Stripe em Produção
      const paymentIntent = await stripe.paymentIntents.create({
        amount: booking.service.price * 100, // Stripe usa centavos
        currency: 'eur',
        payment_method: paymentMethodId,
        confirm: true
      });
    */

    // Simulação de Sucesso do Gateway
    booking.paymentStatus = 'paid';
    booking.paymentMethod = 'card'; // Assume cartão para este endpoint
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
 * CONSULTAR ESTADO DO PAGAMENTO
 * * Permite verificar se uma reserva específica já foi liquidada.
 * * Possui controlo de acesso: Apenas o Cliente dono da reserva ou um Admin
 * podem ver estes detalhes financeiros.
 * * @param req - ID da marcação nos parâmetros da URL
 * @param res - Objeto com status, método e data de pagamento
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('service')
      .select('paymentStatus paymentMethod paidAt customerNif service customer'); // Select otimizado

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Verificação de Permissões (Cliente Dono ou Admin)
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