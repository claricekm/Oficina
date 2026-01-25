/**
 * SCRIPT DE SEEDING (Admin Inicial)
 * * Este script deve ser corrido apenas uma vez para iniciar o projeto.
 * * Cria um utilizador 'Admin' e uma 'Oficina' de teste.
 * * Comando para executar: node scripts/seedAdmin.js
 * * @module scripts/seedAdmin
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente (.env)
dotenv.config();

// Importar os modelos necessários
const User = require('../models/User');
const Workshop = require('../models/Workshop');

/**
 * FUNÇÃO PRINCIPAL DE SEED
 * * Conecta ao MongoDB, verifica duplicados e cria os dados.
 */
const seedAdmin = async () => {
  try {
    // 1. Conexão à Base de Dados
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 2. Verificar se já existe um Admin
    // Evita criar duplicados se o script for corrido 2 vezes
    const existingUser = await User.findOne({ email: 'admin@oficina.pt' });
    if (existingUser) {
      console.log('⚠️  Admin already exists!');
      console.log('Email: admin@oficina.pt');
      console.log('Password: admin123');
      process.exit(0);
    }

    // 3. Criar Utilizador Admin
    console.log('Encriping password...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const user = await User.create({
      name: 'Admin Teste',
      email: 'admin@oficina.pt',
      password: hashedPassword,
      role: 'admin',
      // Campos opcionais do UserSchema (nif, phone) ficam como null/default
    });

    // 4. Criar Oficina associada ao Admin
    console.log('Creating Workshop...');
    const workshop = await Workshop.create({
      name: 'Oficina Teste',
      address: 'Rua Principal, 100',
      city: 'Lisboa',
      postalCode: '1000-001',
      nif: '507667979', // NIF de teste válido
      contact: '912345678',
      owner: user._id
    });

    // 5. Atualizar Admin com o ID da Oficina
    // Isto fecha o ciclo de relacionamento bidirecional
    user.workshop = workshop._id;
    await user.save();

    console.log('================================');
    console.log('🚀 Admin created successfully!');
    console.log('Email: admin@oficina.pt');
    console.log('Password: admin123');
    console.log('================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedAdmin();