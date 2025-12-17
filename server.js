const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

/*const connectDB = require('./config/db');

// Carregar variáveis de ambiente
const sysvars = dotenv.config();
// Conectar à base de d
// ados
connectDB();
*/


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://pv33623_db_user:RIwOzPzRyTgnn0S7@cluster0.29zhafd.mongodb.net/test1?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ API Oficina Automóvel',
    environment: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr na porta ${PORT}`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 Acede em: http://localhost:${PORT}`);
});

