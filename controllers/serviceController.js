const Service = require('../models/Service');
const Workshop = require('../models/Workshop');

// Create service (only admin of the workshop)
exports.createService = async (req, res) => {
  try {
    const { name, type, publicDescription, privateDescription, durationMinutes, price } = req.body;

    // Verify user is admin and has a workshop
    if (req.user.role !== 'admin' || !req.user.workshop) {
      return res.status(403).json({ message: 'Apenas admins podem criar serviços' });
    }

    const service = await Service.create({
      workshop: req.user.workshop,
      name,
      type,
      publicDescription,
      privateDescription,
      durationMinutes,
      price
    });

    res.status(201).json({
      message: 'Serviço criado com sucesso',
      service
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all services from a workshop
exports.getServicesByWorkshop = async (req, res) => {
  try {
    const services = await Service.find({ 
      workshop: req.params.workshopId,
      active: true 
    });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single service
exports.getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('workshop');
    
    if (!service) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update service (only admin of that workshop)
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    // Check if user is admin of this workshop
    if (service.workshop.toString() !== req.user.workshop) {
      return res.status(403).json({ message: 'Sem permissão para editar este serviço' });
    }

    const { name, type, publicDescription, privateDescription, durationMinutes, price, active } = req.body;

    if (name) service.name = name;
    if (type) service.type = type;
    if (publicDescription) service.publicDescription = publicDescription;
    if (privateDescription) service.privateDescription = privateDescription;
    if (durationMinutes) service.durationMinutes = durationMinutes;
    if (price) service.price = price;
    if (active !== undefined) service.active = active;

    await service.save();

    res.json({
      message: 'Serviço atualizado com sucesso',
      service
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete service (only admin)
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    // Check permission
    if (service.workshop.toString() !== req.user.workshop) {
      return res.status(403).json({ message: 'Sem permissão para apagar este serviço' });
    }

    await service.deleteOne();

    res.json({ message: 'Serviço apagado com sucesso' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
