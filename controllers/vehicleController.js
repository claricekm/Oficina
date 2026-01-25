const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { formatLicensePlate, validateLicensePlate } = require('../utils/helpers');
const { getMakes, getModels, getFuelTypesForModel, getAllFuelTypes } = require('../data/vehicleData');

// Create vehicle (customer only)
exports.createVehicle = async (req, res) => {
  try {
    const { brand, model, licensePlate, year, fuelType } = req.body;

    // Validate license plate format
    if (!validateLicensePlate(licensePlate)) {
      return res.status(400).json({ message: 'Formato de matrícula inválido. Use: AA-00-AA, 00-AA-00 ou 00-00-AA' });
    }

    // Format license plate
    const formattedPlate = formatLicensePlate(licensePlate);

    // Check if license plate already exists
    const existingVehicle = await Vehicle.findOne({ licensePlate: formattedPlate });
    if (existingVehicle) {
      return res.status(400).json({ message: 'Matrícula já registada' });
    }

    const vehicle = await Vehicle.create({
      owner: req.user.id,
      brand,
      model,
      licensePlate: formattedPlate,
      year,
      fuelType
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

    const { brand, model, licensePlate, year, fuelType } = req.body;

    if (brand) vehicle.brand = brand;
    if (model) vehicle.model = model;
    if (licensePlate) {
      // Validate license plate format
      if (!validateLicensePlate(licensePlate)) {
        return res.status(400).json({ message: 'Formato de matrícula inválido. Use: AA-00-AA, 00-AA-00 ou 00-00-AA' });
      }
      vehicle.licensePlate = formatLicensePlate(licensePlate);
    }
    if (year) vehicle.year = year;
    if (fuelType !== undefined) vehicle.fuelType = fuelType;

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

// ==========================================
// Vehicle Data Cascade Endpoints (Public)
// ==========================================

// Get all vehicle makes
exports.getVehicleMakes = async (req, res) => {
  try {
    const makes = getMakes();
    res.json(makes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get models for a specific make
exports.getVehicleModels = async (req, res) => {
  try {
    const { make } = req.params;
    const models = getModels(make);
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get fuel types for a specific make and model
exports.getVehicleFuelTypes = async (req, res) => {
  try {
    const { make, model } = req.params;
    const fuelTypes = getFuelTypesForModel(make, model);
    res.json(fuelTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all fuel types
exports.getAllFuelTypes = async (req, res) => {
  try {
    const fuelTypes = getAllFuelTypes();
    res.json(fuelTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
