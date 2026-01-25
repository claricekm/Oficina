const User = require('../models/User');
const Workshop = require('../models/Workshop');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { capitalizeFirstLetter, validateNIF, validatePostalCode, formatPostalCode, validatePhone, formatPhoneNumber } = require('../utils/helpers');

// Register Admin + Create Workshop
exports.registerAdmin = async (req, res) => {
  try {
    console.log('Dados recebidos:', req.body);
    const { name, email, password, workshopName, address, contact } = req.body;

    // Validate required fields
    if (!city || !postalCode || !nif) {
      return res.status(400).json({ message: 'Cidade, código postal e NIF são obrigatórios' });
    }

    // Validate NIF format
    if (!validateNIF(nif)) {
      return res.status(400).json({ message: 'NIF inválido. Deve ter 9 dígitos válidos.' });
    }

    // Validate postal code format
    if (!validatePostalCode(postalCode)) {
      return res.status(400).json({ message: 'Código postal inválido. Formato: XXXX-XXX' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já registado' });
    }

    // Check if NIF already exists
    const existingWorkshop = await Workshop.findOne({ nif });
    if (existingWorkshop) {
      return res.status(400).json({ message: 'Já existe uma oficina registada com este NIF' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Normalize names and city
    const normalizedName = capitalizeFirstLetter(name);
    const normalizedWorkshopName = capitalizeFirstLetter(workshopName);
    const normalizedCity = capitalizeFirstLetter(city);
    const formattedPostalCode = formatPostalCode(postalCode);

    // Create user first (sem workshop ainda)
    const user = await User.create({
      name: normalizedName,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    // Create workshop
    const workshop = await Workshop.create({
      name: normalizedWorkshopName,
      address,
      city: normalizedCity,
      postalCode :formatPostalCode,
      nif,
      contact,
      owner: user._id
    });

    // Update user with workshop
    user.workshop = workshop._id;
    await user.save();

    // CRIAR TOKEN JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        workshop: workshop._id
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // RETORNAR TOKEN E USER COMPLETO
    res.status(201).json({
      message: 'Admin e oficina criados com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workshop: {
          id: workshop._id,
          name: workshop.name,
          address: workshop.address,
          city: workshop.city,
          postalCode: workshop.postalCode,
          nif: workshop.nif,
          contact: workshop.contact
        }
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register Customer
exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, password, phone, nif } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já registado' });
    }

    // Validate NIF if provided
    if (nif && !validateNIF(nif)) {
      return res.status(400).json({ message: 'NIF inválido. Deve ter 9 dígitos válidos.' });
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ message: 'Número de telefone inválido. Use formato português (9XX XXX XXX).' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedName = capitalizeFirstLetter(name);
    const formattedPhone = phone ? formatPhoneNumber(phone) : null;

    const user = await User.create({
      name: normalizedName,
      email,
      password: hashedPassword,
      role: 'customer',
      phone: formattedPhone,
      nif: nif || null
    });

    // CRIAR TOKEN JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // RETORNAR TOKEN E USER
    res.status(201).json({
      message: 'Cliente registado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        nif: user.nif
      }
    });


  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register Mechanic (Admin only - creates mechanic for their workshop)
exports.registerMechanic = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const adminWorkshopId = req.user.workshop;

    // Verify admin has a workshop
    if (!adminWorkshopId) {
      return res.status(400).json({ message: 'Admin não está associado a nenhuma oficina' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já registado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedName = capitalizeFirstLetter(name);

    // Create mechanic user associated with admin's workshop
    const user = await User.create({
      name: normalizedName,
      email,
      password: hashedPassword,
      role: 'mechanic',
      workshop: adminWorkshopId
    });

    res.status(201).json({
      message: 'Mecânico registado com sucesso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workshop: user.workshop
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('workshop');
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    // Create token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        workshop: user.workshop?._id || null
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workshop: user.workshop
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

