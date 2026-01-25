/**
 * CONTROLADOR DE OFICINAS (Workshop Controller)
 * * Gere os perfis das oficinas parceiras.
 * * Permite edição de dados de contacto, horário e listagem para clientes.
 * * @module controllers/workshopController
 */

const Workshop = require('../models/Workshop');
const Service = require('../models/Service');
// Importação de validadores para garantir qualidade dos dados
const { 
  validatePhone, 
  formatPhoneNumber, 
  validatePostalCode, 
  formatPostalCode, 
  capitalizeFirstLetter 
} = require('../utils/helpers');

/**
 * OBTER DETALHES DA OFICINA
 * * Retorna o perfil completo de uma oficina específica.
 * * Usado na página de perfil da oficina.
 * * @param req - ID da oficina na URL
 */
exports.getWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({ message: 'Oficina não encontrada' });
    }

    res.json(workshop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * LISTAR SERVIÇOS DA OFICINA
 * * Endpoint auxiliar essencial.
 * * Quando o cliente clica numa oficina, este endpoint lista
 * * todos os serviços (Troca de Óleo, Pneus, etc.) que ela oferece.
 */
exports.getWorkshopServices = async (req, res) => {
  try {
    const services = await Service.find({ workshop: req.params.id });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ATUALIZAR OFICINA
 * * Permite ao Dono (Admin) alterar morada, contactos e horários.
 * * Inclui validação de Código Postal e Telefone Português.
 * * Normaliza texto (Primeira letra maiúscula) para manter o site bonito.
 */
exports.updateWorkshop = async (req, res) => {
  try {
    const { name, address, city, postalCode, contact, openingHours, maxSlotsPerHour } = req.body;

    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
      return res.status(404).json({ message: 'Oficina não encontrada' });
    }

    // Segurança: Apenas o dono pode editar a sua própria oficina
    if (workshop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão para editar esta oficina' });
    }

    // --- VALIDAÇÕES ---
    if (postalCode && !validatePostalCode(postalCode)) {
      return res.status(400).json({ message: 'Código postal inválido. Formato: XXXX-XXX' });
    }

    if (contact && !validatePhone(contact)) {
      return res.status(400).json({ message: 'Número de contacto inválido. Use formato português (9XX XXX XXX).' });
    }

    // --- ATUALIZAÇÃO COM FORMATAÇÃO ---
    if (name) workshop.name = capitalizeFirstLetter(name);
    if (address) workshop.address = address;
    if (city) workshop.city = capitalizeFirstLetter(city);
    // Formata CP e Telefone para garantir padrão visual
    if (postalCode) workshop.postalCode = formatPostalCode(postalCode);
    if (contact) workshop.contact = formatPhoneNumber(contact);
    
    if (openingHours) workshop.openingHours = openingHours;
    if (maxSlotsPerHour) workshop.maxSlotsPerHour = maxSlotsPerHour;

    await workshop.save();

    res.json({
      message: 'Oficina atualizada com sucesso',
      workshop
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * LISTAR TODAS AS OFICINAS
 * * Catálogo público para os clientes procurarem onde reparar o carro.
 */
exports.getAllWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find().select('-__v');
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};