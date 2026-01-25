/**
 * MIDDLEWARE GLOBAL DE ERROS
 * * Intercepta qualquer erro lançado nas rotas com next(err).
 * * Centraliza o tratamento de falhas para evitar crashar o servidor.
 * * Garante que o cliente recebe sempre um JSON (e não uma página HTML de erro).
 * * @module middleware/errorMiddleware
 */

/**
 * FUNÇÃO DE TRATAMENTO DE ERROS
 * * @param err - O objeto de erro capturado (contém message e statusCode)
 * * @param req - Objeto da requisição
 * * @param res - Objeto da resposta
 * * @param next - Função next (obrigatória em middlewares de erro, mesmo se não usada)
 */
const errorMiddleware = (err, req, res, next) => {
  // Log no terminal para o programador ver o que aconteceu
  console.error('Erro Capturado:', err.message);
  
  // Se o erro tiver um código específico (ex: 404, 403), usa-o.
  // Caso contrário, assume erro genérico do servidor (500).
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    // Dica: Em ambiente de desenvolvimento, poderia adicionar 'stack: err.stack' aqui
  });
};

module.exports = errorMiddleware;