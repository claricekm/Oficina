const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('❌ Define MONGO_URI no .env.local ou Vercel');
}

// Cache global para serverless (Vercel/Next.js)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    console.log('✅ Usando conexão cached');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Evita buffer em serverless
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    
    // 🆕 TESTES ATLAS (remove depois)
    console.log('🗺️  Host conectado:', mongoose.connection.host);           // cluster0.29zhafd.mongodb.net = ATLAS!
    console.log('🗺️  Nome DB:', mongoose.connection.name);                  // oficina = ATLAS
    console.log('🗺️  Ready State:', mongoose.connection.readyState);        // 1 = conectado
    
    // Ping para confirmar vivo
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log('🏓 Ping Atlas confirmado!');
    
    console.log('✅ MongoDB conectado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    cached.promise = null;
    cached.conn = null;
    process.exit(1);
  }
};

module.exports = connectDB;
