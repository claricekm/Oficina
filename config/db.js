// config/db.js
const mongoose = require('mongoose');

const connectDB = () => {
    //await mongoose.connect(process.env.MONGO_URI);
    //mongoose.connect("mongodb+srv://pv33623_db_user:RIwOzPzRyTgnn0S7@cluster0.29zhafd.mongodb.net/?appName=Cluster0"
    mongoose.connect("mongodb://localhost:27017/TDWTEST"
    );
    mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB conectado com sucesso');
    });
    mongoose.connection.on('error', (error) => {
        console.error('❌ Erro ao conectar ao MongoDB:', error.message);
        process.exit(1);
    });
};

module.exports = connectDB;
