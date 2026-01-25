/**
 * CONTROLADOR DE SERVIÇOS (Service Menu)
 * * Permite aos gestores da oficina (Admins) criar, editar e remover os serviços
 * que prestam.
 * * Clientes podem listar estes serviços para fazer marcações.
 * * @module controllers/serviceController
 */

const Service = require('../models/Service');
const Workshop = require('../models/Workshop');

/**
 * CRIAR SERVIÇO
 * * Adiciona um novo tipo de reparação ao menu da oficina.
 * * Apenas Admins com uma oficina associada podem criar.
 * * @param req - Body com nome, preços, duração estimada, etc.
 * @param res - Retorna o serviço criado
 */
exports.createService = async (req, res) => {
  try {
    const { name, type, publicDescription, privateDescription, durationMinutes, price } = req.body;

    // Verificar se é admin e se tem oficina
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

/**
 * LISTAR SERVIÇOS DA OFICINA
 * * Endpoint público (ou autenticado) para popular os selects no Frontend.
 * * Retorna apenas serviços ativos (`active: true`).
 * * @param req - workshopId na URL
 */
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

/**
 * OBTER DETALHES DO SERVIÇO
 * * Retorna toda a informação de um serviço específico.
 */
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

/**
 * ATUALIZAR SERVIÇO
 * * Permite alterar preços, descrições ou desativar o serviço.
 * * Segurança: Garante que o admin que está a editar é dono da oficina desse serviço.
 */
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    // Verificar se o utilizador é dono da oficina deste serviço
    if (service.workshop.toString() !== req.user.workshop) {
      return res.status(403).json({ message: 'Sem permissão para editar este serviço' });
    }

    const { name, type, publicDescription, privateDescription, durationMinutes, price, active } = req.body;

    // Atualização condicional (apenas campos enviados)
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

/**
 * REMOVER SERVIÇO
 * * Apaga o serviço da base de dados.
 * * Nota: Em sistemas reais, preferimos usar `active: false` (Soft Delete)
 * para não quebrar histórico de agendamentos passados, mas esta função
 * de Hard Delete é útil para correções de erros de criação.
 */
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    // Verificar permissão
    if (service.workshop.toString() !== req.user.workshop) {
      return res.status(403).json({ message: 'Sem permissão para apagar este serviço' });
    }

    await service.deleteOne();

    res.json({ message: 'Serviço apagado com sucesso' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};