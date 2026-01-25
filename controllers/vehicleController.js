/**
 * CONTROLADOR DE VEÍCULOS
 * * Gere o registo de viaturas dos clientes.
 * * Inclui validação de matrículas portuguesas e endpoints auxiliares
 * para preencher listas de Marcas e Modelos no Frontend.
 * * @module controllers/vehicleController
 */

const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
// Funções importadas dos utilitários (Validação de Matrícula)
const { formatLicensePlate, validateLicensePlate } = require('../utils/helpers');
// Dados estáticos ou dinâmicos de viaturas (Marcas, Modelos)
const { getMakes, getModels, getFuelTypesForModel, getAllFuelTypes } = require('../data/vehicleData');

/**
 * REGISTAR VEÍCULO
 * * Adiciona uma viatura à garagem do cliente.
 * * Valida o formato da matrícula antes de salvar.
 * * @param req - Body com brand, model, licensePlate, year, fuelType
 * @param res - Retorna o veículo criado
 */
exports.createVehicle = async (req, res) => {
  try {
    const { brand, model, licensePlate, year, fuelType } = req.body;

    // Validação rigorosa da matrícula (Padrão Português)
    if (!validateLicensePlate(licensePlate)) {
      return res.status(400).json({ message: 'Formato de matrícula inválido. Use: AA-00-AA, 00-AA-00 ou 00-00-AA' });
    }

    // Formatação (Ex: garantir maiúsculas)
    const formattedPlate = formatLicensePlate(licensePlate);

    // Verificar duplicidade
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

    // Vincular o veículo à conta do utilizador (Array de veículos)
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

/**
 * LISTAR MEUS VEÍCULOS
 * * Retorna todas as viaturas associadas ao utilizador logado.
 */
exports.getMyVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user.id });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * OBTER DETALHES DO VEÍCULO
 * * Retorna dados de um veículo específico.
 * * Segurança: Garante que o utilizador só vê os seus próprios carros.
 */
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Veículo não encontrado' });
    }

    // Verificação de Propriedade
    if (vehicle.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão para ver este veículo' });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ATUALIZAR VEÍCULO
 * * Permite corrigir dados da viatura.
 * * Se a matrícula for alterada, ela é revalidada e reformatada.
 */
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Veículo não encontrado' });
    }

    // Verificação de Propriedade
    if (vehicle.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão para editar este veículo' });
    }

    const { brand, model, licensePlate, year, fuelType } = req.body;

    if (brand) vehicle.brand = brand;
    if (model) vehicle.model = model;
    
    // Lógica especial para atualização de matrícula
    if (licensePlate) {
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

/**
 * APAGAR VEÍCULO
 * * Remove a viatura e atualiza a lista de veículos do utilizador.
 */
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Veículo não encontrado' });
    }

    // Verificação de Propriedade
    if (vehicle.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão para apagar este veículo' });
    }

    // Remover referência no User antes de apagar o documento
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
// ENDPOINTS AUXILIARES DE DADOS (Públicos)
// Usados para popular os selects no Frontend
// ==========================================

/**
 * LISTAR MARCAS
 * * Retorna lista de fabricantes (ex: BMW, Audi, Toyota).
 */
exports.getVehicleMakes = async (req, res) => {
  try {
    const makes = getMakes();
    res.json(makes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * LISTAR MODELOS
 * * Retorna modelos baseado na marca selecionada.
 * * @param req - Parâmetro 'make' na URL
 */
exports.getVehicleModels = async (req, res) => {
  try {
    const { make } = req.params;
    const models = getModels(make);
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * LISTAR COMBUSTÍVEIS POR MODELO
 * * Retorna tipos de motor (Diesel, Gasolina, Elétrico) compatíveis com o modelo.
 */
exports.getVehicleFuelTypes = async (req, res) => {
  try {
    const { make, model } = req.params;
    const fuelTypes = getFuelTypesForModel(make, model);
    res.json(fuelTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * TODOS OS COMBUSTÍVEIS
 * * Lista genérica de tipos de combustível.
 */
exports.getAllFuelTypes = async (req, res) => {
  try {
    const fuelTypes = getAllFuelTypes();
    res.json(fuelTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};