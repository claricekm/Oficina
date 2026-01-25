/**
 * ROTAS DE AUTENTICAÇÃO (Auth Routes)
 * * Define os pontos de entrada para Login e Registos.
 * * @module routes/authRoutes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Importar middlewares de segurança
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/rbacMiddleware');

console.log('✅ authRoutes.js carregado');

/**
 * REGISTAR ADMIN (Dono da Oficina)
 * * Rota pública. Cria o utilizador Admin e a Oficina ao mesmo tempo.
 * * POST /api/auth/register/admin
 */
router.post('/register/admin', authController.registerAdmin);

/**
 * REGISTAR CLIENTE
 * * Rota pública. Qualquer pessoa pode criar conta para marcar serviços.
 * * POST /api/auth/register/customer
 */
router.post('/register/customer', authController.registerCustomer);

/**
 * REGISTAR MECÂNICO (Staff)
 * * Rota Protegida: Apenas um Admin autenticado pode criar contas para mecânicos.
 * * POST /api/auth/register/mechanic
 */
router.post(
  '/register/mechanic', 
  authMiddleware, // 1. Verifica se quem pede está logado
  adminOnly,      // 2. Verifica se quem pede é Admin
  authController.registerMechanic // 3. Executa a criação
);

/**
 * LOGIN
 * * Rota pública. Retorna o Token JWT.
 * * POST /api/auth/login
 */
router.post('/login', authController.login);

module.exports = router;