const User = require('../models/User');
const Workshop = require('../models/Workshop');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register Admin + Create Workshop
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, workshopName, address, contact } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já registado' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user first (sem workshop ainda)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    // Create workshop
    const workshop = await Workshop.create({
      name: workshopName,
      address,
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
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já registado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'customer'
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
        role: user.role
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
