/**
 * CLASSE DE CONEXÃO AO BANCO DE DADOS
 * * Responsável por gerir a ligação entre a aplicação e o MongoDB.
 * * @author Seu Nome / Equipa
 * @version 1.0
 */
const mongoose = require('mongoose');

/**
 * METODO CONNECT_DB
 * * Inicia a ligação ao MongoDB através da URI fornecida nas variáveis de ambiente.
 * Caso a ligação falhe, o processo é interrompido.
 * * @async
 * @returns Promise<void> - Não retorna valor, apenas estabelece a conexão.
 * @throws Error - Lança erro se a URI for inválida ou o servidor estiver offline.
 */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB conectado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;