/**
 * SERVIDOR PRINCIPAL (Entry Point)
 * * O coração da aplicação.
 * * 1. Conecta à Base de Dados.
 * * 2. Inicia serviços de background (Scheduler).
 * * 3. Configura Middlewares globais (CORS, JSON).
 * * 4. Define todas as rotas da API.
 * * 5. Gere erros centralizados.
 * * @module server
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente (.env)
dotenv.config();

const connectDB = require('./config/db');
const { initScheduler } = require('./services/schedulerService');

// --- INICIALIZAÇÃO DE SISTEMAS ---

// Conectar à base de dados antes de tudo
connectDB().then(() => {
  // Apenas inicia o agendador de tarefas se a BD estiver conectada com sucesso
  initScheduler();
});

const app = express();

// --- MIDDLEWARES GLOBAIS ---
app.use(cors()); // Permite pedidos do Frontend (Next.js)
app.use(express.json()); // Permite ler JSON no body dos pedidos
app.use(express.urlencoded({ extended: true }));

// --- IMPORTAR ROTAS ---
const authRoutes = require('./routes/authRoutes');
const workshopRoutes = require('./routes/workshopRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const priceSimulationRoutes = require('./routes/priceSimulationRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Middleware de erros (importado por último para apanhar falhas nas rotas)
const errorMiddleware = require('./middleware/errorMiddleware');

// --- DEFINIÇÃO DE ENDPOINTS ---

// Rota de teste (Health Check)
app.get('/', (req, res) => {
  res.json({
    message: '✅ API Oficina Automóvel Online',
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    timestamp: new Date().toISOString()
  });
});

// Registar Rotas
app.use('/api/auth', authRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/simulations', priceSimulationRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/payments', paymentRoutes);

// --- TRATAMENTO DE ERROS ---
// Deve ser sempre o último app.use()
app.use(errorMiddleware);

// --- ARRANQUE DO SERVIDOR ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr na porta ${PORT}`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 Acede em: http://localhost:${PORT}`);
});