const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const connectDB = require('./config/db');

// Conectar à base de dados
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rotas e middleware
const authRoutes = require('./routes/authRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

// Rota de teste
app.get('/', (req, res) => {
  res.json({
    message: '✅ API Oficina Automóvel',
    environment: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);

// Error handler (sempre no fim)
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr na porta ${PORT}`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 Acede em: http://localhost:${PORT}`);
});
