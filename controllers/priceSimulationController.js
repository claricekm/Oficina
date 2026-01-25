const PriceSimulation = require('../models/PriceSimulation');
const Service = require('../models/Service');
const Vehicle = require('../models/Vehicle');

// Create price simulation (authenticated users)
exports.createSimulation = async (req, res) => {
  try {
    const { workshopId, vehicleId, serviceIds } = req.body;

    // Validate vehicle belongs to user (if vehicleId provided)
    if (vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle || vehicle.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Veículo inválido' });
      }
    }

    // Get all services and calculate total
    const services = await Service.find({ 
      _id: { $in: serviceIds },
      workshop: workshopId 
    });

    if (services.length !== serviceIds.length) {
      return res.status(400).json({ message: 'Um ou mais serviços inválidos' });
    }

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

// Get my simulations (customer)
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

// Get single simulation
exports.getSimulation = async (req, res) => {
  try {
    const simulation = await PriceSimulation.findById(req.params.id)
      .populate('services', 'name price durationMinutes description')
      .populate('workshop', 'name address phone')
      .populate('vehicle', 'brand model licensePlate year');
    
    if (!simulation) {
      return res.status(404).json({ message: 'Simulação não encontrada' });
    }

    // Check if belongs to user
    if (simulation.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    res.json(simulation);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete simulation (customer)
exports.deleteSimulation = async (req, res) => {
  try {
    const simulation = await PriceSimulation.findById(req.params.id);
    
    if (!simulation) {
      return res.status(404).json({ message: 'Simulação não encontrada' });
    }

    // Check if belongs to user
    if (simulation.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    await simulation.deleteOne();

    res.json({ message: 'Simulação apagada' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get simulations by workshop (admin only)
exports.getSimulationsByWorkshop = async (req, res) => {
  try {
    // Check if user is admin of this workshop
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
