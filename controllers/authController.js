const User = require('../models/User');
const Workshop = require('../models/Workshop');
const RefreshToken = require('../models/RefreshToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { capitalizeFirstLetter, validateNIF, validatePostalCode, formatPostalCode, validatePhone, formatPhoneNumber } = require('../utils/helpers');

// Token configuration
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes per spec
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Helper: Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      workshop: user.workshop || null
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

// Helper: Generate refresh token and save to database
const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Remove any existing refresh tokens for this user (single session)
  await RefreshToken.deleteMany({ user: userId });

  // Create new refresh token
  await RefreshToken.create({
    user: userId,
    token,
    expiresAt
  });

  return token;
};

// Helper: Set cookies for tokens
const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Access token cookie
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000  // 15 minutes
  });

  // Refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000  // 7 days
  });
};

// Register Admin + Create Workshop
exports.registerAdmin = async (req, res) => {
  try {
    console.log('Dados recebidos:', req.body);
    const { name, email, password, workshopName, address, city, postalCode, nif, contact } = req.body;

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
      postalCode: formattedPostalCode,
      nif,
      contact,
      owner: user._id
    });

    // Update user with workshop
    user.workshop = workshop._id;
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user._id);

    // Set HttpOnly cookies
    setTokenCookies(res, accessToken, refreshToken);

    // RETORNAR TOKEN E USER COMPLETO
    res.status(201).json({
      message: 'Admin e oficina criados com sucesso',
      token: accessToken,
      refreshToken,
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

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user._id);

    // Set HttpOnly cookies
    setTokenCookies(res, accessToken, refreshToken);

    // RETORNAR TOKEN E USER
    res.status(201).json({
      message: 'Cliente registado com sucesso',
      token: accessToken,
      refreshToken,
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

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user._id);

    // Set HttpOnly cookies
    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      token: accessToken,  // Keep for backward compatibility
      refreshToken,  // Also return for clients that need it
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

// Refresh access token using refresh token
exports.refresh = async (req, res) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token não fornecido' });
    }

    // Find refresh token in database
    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken) {
      return res.status(401).json({ message: 'Refresh token inválido' });
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      return res.status(401).json({ message: 'Refresh token expirado' });
    }

    // Get user
    const user = await User.findById(storedToken.user).populate('workshop');
    if (!user) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      return res.status(401).json({ message: 'Utilizador não encontrado' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    // Set new access token cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000  // 15 minutes
    });

    res.json({
      token: newAccessToken,
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

// Logout - clear tokens
exports.logout = async (req, res) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    // Delete refresh token from database if it exists
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    // Clear cookies
    res.clearCookie('token');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logout efetuado com sucesso' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

