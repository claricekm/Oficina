/**
 * ROTAS DE AVALIAÇÕES (Review Routes)
 * * Gere o feedback dos clientes sobre os serviços.
 * * Protegido com RBAC para garantir que apenas Clientes avaliam
 * * e apenas Admins moderam.
 * * @module routes/reviewRoutes
 */

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const { customerOnly, adminOnly } = require('../middleware/rbacMiddleware');

console.log('✅ reviewRoutes.js carregado');

// --- ROTAS PÚBLICAS ---

/**
 * LER AVALIAÇÕES DA OFICINA
 * * GET /api/reviews/workshop/:workshopId
 * * Qualquer pessoa pode ler as avaliações públicas.
 */
router.get('/workshop/:workshopId', reviewController.getReviewsByWorkshop);

// --- ROTAS DE CLIENTE ---

/**
 * MINHAS AVALIAÇÕES
 * * GET /api/reviews/my
 * * Lista o histórico de feedback do cliente.
 */
router.get('/my', authMiddleware, customerOnly, reviewController.getMyReviews);

/**
 * CRIAR AVALIAÇÃO
 * * POST /api/reviews
 * * O cliente deixa uma nota (1-5) e comentário sobre um serviço concluído.
 */
router.post('/', authMiddleware, customerOnly, reviewController.createReview);

// --- ROTAS DE ADMIN ---

/**
 * MODERAR COMENTÁRIOS
 * * PUT /api/reviews/:id/visibility
 * * Permite ao Admin ocultar/mostrar comentários.
 */
router.put('/:id/visibility', authMiddleware, adminOnly, reviewController.updateReviewVisibility);

// --- ROTAS MISTAS ---

/**
 * APAGAR AVALIAÇÃO
 * * DELETE /api/reviews/:id
 * * O Cliente pode apagar a sua própria avaliação.
 * * O Admin pode apagar qualquer avaliação da sua oficina.
 * * (A lógica de quem pode apagar o quê está refinada no controlador)
 */
router.delete('/:id', authMiddleware, reviewController.deleteReview);

module.exports = router;