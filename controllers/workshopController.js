const Workshop = require('../models/Workshop');
const Service = require('../models/Service');
const { validatePhone, formatPhoneNumber, validatePostalCode, formatPostalCode, capitalizeFirstLetter } = require('../utils/helpers');


// Get workshop details
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


// Get services from a specific workshop ← NOVA FUNÇÃO
exports.getWorkshopServices = async (req, res) => {
  try {
    const services = await Service.find({ workshop: req.params.id });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Update workshop (only owner/admin)
exports.updateWorkshop = async (req, res) => {
  try {
    const { name, address, city, postalCode, contact, openingHours, maxSlotsPerHour } = req.body;

    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
      return res.status(404).json({ message: 'Oficina não encontrada' });
    }

    // Check if user is the owner
    if (workshop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão para editar esta oficina' });
    }

    // Validate postal code if provided
    if (postalCode && !validatePostalCode(postalCode)) {
      return res.status(400).json({ message: 'Código postal inválido. Formato: XXXX-XXX' });
    }

    // Validate contact phone if provided
    if (contact && !validatePhone(contact)) {
      return res.status(400).json({ message: 'Número de contacto inválido. Use formato português (9XX XXX XXX).' });
    }

    // Update fields with formatting
    if (name) workshop.name = capitalizeFirstLetter(name);
    if (address) workshop.address = address;
    if (city) workshop.city = capitalizeFirstLetter(city);
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


// Get all workshops (for customers to browse)
exports.getAllWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find().select('-__v');
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
