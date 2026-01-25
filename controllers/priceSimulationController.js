/**
 * CONTROLADOR DE SIMULAÇÃO DE PREÇOS
 * * Permite aos clientes simular o custo de reparações antes de agendar.
 * * Calcula totais baseados nos serviços selecionados.
 * * @module controllers/priceSimulationController
 */

const PriceSimulation = require('../models/PriceSimulation');
const Service = require('../models/Service');
const Vehicle = require('../models/Vehicle');

/**
 * CRIAR SIMULAÇÃO
 * * Calcula o preço total e duração estimada para um conjunto de serviços.
 * * Garante que os preços são calculados no backend (segurança) e não no frontend.
 * * @param req - Body com workshopId, vehicleId (opcional) e lista de serviceIds
 * @param res - Retorna o objeto de simulação com totais calculados
 */
exports.createSimulation = async (req, res) => {
  try {
    const { workshopId, vehicleId, serviceIds } = req.body;

    // Validar se o veículo pertence ao utilizador (apenas se enviado)
    if (vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle || vehicle.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Veículo inválido' });
      }
    }

    // Buscar serviços na base de dados para obter preços reais
    // (Impede que o utilizador manipule preços enviando valores falsos)
    const services = await Service.find({ 
      _id: { $in: serviceIds },
      workshop: workshopId 
    });

    if (services.length !== serviceIds.length) {
      return res.status(400).json({ message: 'Um ou mais serviços inválidos' });
    }

    // Cálculos matemáticos no servidor
    const totalPrice = services.reduce((sum, service) => sum + service.price, 0);
    const totalDuration = services.reduce((sum, service) => sum + service.durationMinutes, 0);

    const simulation = await PriceSimulation.create({
      customer: req.user.id,
      workshop: workshopId,
      vehicle: vehicleId || null,
      services: serviceIds,
      totalPrice,
      totalDuration
    });

    const populatedSimulation = await PriceSimulation.findById(simulation._id)
      .populate('services', 'name price durationMinutes')
      .populate('workshop', 'name')
      .populate('vehicle', 'brand model licensePlate');

    res.status(201).json({
      message: 'Simulação criada',
      simulation: populatedSimulation
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * OBTER MINHAS SIMULAÇÕES (Cliente)
 * * Lista histórico de simulações do utilizador logado.
 */
exports.getMySimulations = async (req, res) => {
  try {
    const simulations = await PriceSimulation.find({ customer: req.user.id })
      .populate('services', 'name price durationMinutes')
      .populate('workshop', 'name')
      .populate('vehicle', 'brand model licensePlate')
      .sort({ createdAt: -1 });

    res.json(simulations);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * OBTER UMA SIMULAÇÃO
 * * Detalhes de uma simulação específica.
 * * Protegido: Apenas o dono pode ver.
 */
exports.getSimulation = async (req, res) => {
  try {
    const simulation = await PriceSimulation.findById(req.params.id)
      .populate('services', 'name price durationMinutes description')
      .populate('workshop', 'name address phone')
      .populate('vehicle', 'brand model licensePlate year');
    
    if (!simulation) {
      return res.status(404).json({ message: 'Simulação não encontrada' });
    }

    // Verificação de segurança
    if (simulation.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    res.json(simulation);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * APAGAR SIMULAÇÃO
 * * Permite ao cliente limpar seu histórico de simulações.
 */
exports.deleteSimulation = async (req, res) => {
  try {
    const simulation = await PriceSimulation.findById(req.params.id);
    
    if (!simulation) {
      return res.status(404).json({ message: 'Simulação não encontrada' });
    }

    // Verificação de segurança
    if (simulation.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    await simulation.deleteOne();

    res.json({ message: 'Simulação apagada' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * LISTAR SIMULAÇÕES POR OFICINA (Admin)
 * * Permite ao dono da oficina ver que tipos de orçamentos os clientes andam a simular.
 * * Útil para análise de negócio (leads).
 */
exports.getSimulationsByWorkshop = async (req, res) => {
  try {
    // Apenas o Admin daquela oficina específica pode ver
    if (req.user.role !== 'admin' || req.user.workshop !== req.params.workshopId) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    const simulations = await PriceSimulation.find({ workshop: req.params.workshopId })
      .populate('customer', 'name email')
      .populate('services', 'name price')
      .populate('vehicle', 'brand model licensePlate')
      .sort({ createdAt: -1 });

    res.json(simulations);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};