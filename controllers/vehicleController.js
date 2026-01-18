const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// Create vehicle (customer only)
exports.createVehicle = async (req, res) => {
  try {
    const { brand, model, licensePlate, year } = req.body;

    // Check if license plate already exists
    const existingVehicle = await Vehicle.findOne({ licensePlate });
    if (existingVehicle) {
      return res.status(400).json({ message: 'Matrícula já registada' });
    }

    const vehicle = await Vehicle.create({
      owner: req.user.id,
      brand,
      model,
      licensePlate,
      year
    });

    // Add vehicle to user's vehicles array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { vehicles: vehicle._id }
    });

    res.status(201).json({
      message: 'Veículo registado com sucesso',
      vehicle
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all vehicles of logged user
exports.getMyVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user.id });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single vehicle
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Veículo não encontrado' });
    }

    // Check if user owns this vehicle
    if (vehicle.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão para ver este veículo' });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Veículo não encontrado' });
    }

    // Check ownership
    if (vehicle.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão para editar este veículo' });
    }

    const { brand, model, licensePlate, year } = req.body;

    if (brand) vehicle.brand = brand;
    if (model) vehicle.model = model;
    if (licensePlate) vehicle.licensePlate = licensePlate;
    if (year) vehicle.year = year;

    await vehicle.save();

    res.json({
      message: 'Veículo atualizado com sucesso',
      vehicle
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Veículo não encontrado' });
    }

    // Check ownership
    if (vehicle.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão para apagar este veículo' });
    }

    // Remove from user's vehicles array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { vehicles: vehicle._id }
    });

    await vehicle.deleteOne();

    res.json({ message: 'Veículo apagado com sucesso' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
