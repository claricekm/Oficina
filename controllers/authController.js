/**
 * CONTROLADOR DE AUTENTICAÇÃO (Auth Controller)
 * * Responsável pelo registo de utilizadores (Admin, Cliente, Mecânico),
 * criação de oficinas e processo de login.
 * * @module controllers/authController
 * @requires mongoose
 * @requires bcryptjs
 * @requires jsonwebtoken
 */

const User = require('../models/User');
const Workshop = require('../models/Workshop');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { 
    capitalizeFirstLetter, 
    validateNIF, 
    validatePostalCode, 
    formatPostalCode, 
    validatePhone, 
    formatPhoneNumber 
} = require('../utils/helpers');

/**
 * REGISTAR ADMIN E OFICINA
 * * Cria um utilizador 'admin' e, simultaneamente, cria a sua oficina.
 * Realiza validações estritas de NIF e Código Postal de Portugal.
 * * @async
 * @param Object req - Objeto de requisição do Express
 * @param Object res - Objeto de resposta do Express
 * @returns Object JSON com mensagem, token JWT e dados do utilizador
 */
exports.registerAdmin = async (req, res) => {
  try {
    console.log('Dados recebidos:', req.body);
    
    // Extração dos dados (Adicionei city, postalCode e nif que faltavam na extração)
    const { name, email, password, workshopName, address, contact, city, postalCode, nif } = req.body;

    // --- VALIDAÇÕES ---
    
    // 1. Campos obrigatórios
    if (!city || !postalCode || !nif) {
      return res.status(400).json({ message: 'Cidade, código postal e NIF são obrigatórios' });
    }

    // 2. Validação de formato NIF (Portugal)
    if (!validateNIF(nif)) {
      return res.status(400).json({ message: 'NIF inválido. Deve ter 9 dígitos válidos.' });
    }

    // 3. Validação de formato Código Postal (XXXX-XXX)
    if (!validatePostalCode(postalCode)) {
      return res.status(400).json({ message: 'Código postal inválido. Formato: XXXX-XXX' });
    }

    // 4. Verificação de duplicidade de Email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já registado' });
    }

    // 5. Verificação de duplicidade de NIF da Oficina
    const existingWorkshop = await Workshop.findOne({ nif });
    if (existingWorkshop) {
      return res.status(400).json({ message: 'Já existe uma oficina registada com este NIF' });
    }

    // --- CRIAÇÃO DE DADOS ---

    // Hash da password para segurança
    const hashedPassword = await bcrypt.hash(password, 10);

    // Normalização de Strings (Primeira letra maiúscula)
    const normalizedName = capitalizeFirstLetter(name);
    const normalizedWorkshopName = capitalizeFirstLetter(workshopName);
    const normalizedCity = capitalizeFirstLetter(city);
    const formattedPostalCode = formatPostalCode(postalCode);

    // 1. Criar Utilizador (Admin)
    const user = await User.create({
      name: normalizedName,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    // 2. Criar Oficina vinculada ao Admin
    const workshop = await Workshop.create({
      name: normalizedWorkshopName,
      address,
      city: normalizedCity,
      postalCode: formattedPostalCode,
      nif,
      contact,
      owner: user._id
    });

    // 3. Atualizar Admin com o ID da Oficina criada
    user.workshop = workshop._id;
    await user.save();

    // --- AUTENTICAÇÃO ---

    // Gerar Token JWT
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

    // Retornar sucesso
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

/**
 * REGISTAR CLIENTE (Customer)
 * * Regista um utilizador final. Valida NIF e Telefone apenas se fornecidos.
 * * @async
 * @param Object req - Body contendo dados do cliente
 * @param Object res - Resposta JSON
 */
exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, password, phone, nif } = req.body;

    // Verificar existência
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já registado' });
    }

    // Validações Opcionais (apenas se o campo vier preenchido)
    if (nif && !validateNIF(nif)) {
      return res.status(400).json({ message: 'NIF inválido. Deve ter 9 dígitos válidos.' });
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ message: 'Número de telefone inválido. Use formato português (9XX XXX XXX).' });
    }

    // Preparação dos dados
    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedName = capitalizeFirstLetter(name);
    const formattedPhone = phone ? formatPhoneNumber(phone) : null;

    // Criação do Cliente
    const user = await User.create({
      name: normalizedName,
      email,
      password: hashedPassword,
      role: 'customer',
      phone: formattedPhone,
      nif: nif || null
    });

    // Gerar Token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

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

/**
 * REGISTAR MECÂNICO
 * * Apenas acessível por Admins autenticados.
 * Cria um utilizador 'mechanic' e associa-o automaticamente à oficina do Admin.
 * * @async
 * @requires middleware/auth - Requer que req.user esteja preenchido pelo middleware de autenticação
 */
exports.registerMechanic = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // O ID da oficina vem do token do Admin logado (req.user)
    const adminWorkshopId = req.user.workshop;

    // Validação de Segurança
    if (!adminWorkshopId) {
      return res.status(400).json({ message: 'Admin não está associado a nenhuma oficina' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já registado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedName = capitalizeFirstLetter(name);

    // Criação do Mecânico associado à oficina
    const user = await User.create({
      name: normalizedName,
      email,
      password: hashedPassword,
      role: 'mechanic',
      workshop: adminWorkshopId // Vínculo automático
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

/**
 * LOGIN DE UTILIZADOR
 * * Autentica qualquer tipo de utilizador (Admin, Mechanic, Customer).
 * Retorna o Token JWT necessário para rotas protegidas.
 * * @async
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Busca utilizador e popula os dados da oficina (se existir)
    const user = await User.findOne({ email }).populate('workshop');
    
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    // Comparar password (texto plano vs hash)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    // Criação do Payload do Token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        // Inclui ID da oficina se o utilizador for Admin ou Mecânico
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