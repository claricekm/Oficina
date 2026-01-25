/**
 * MIDDLEWARE DE AUTENTICAÇÃO (JWT)
 * * Intercepta todas as requisições para rotas protegidas.
 * * Verifica se existe um Token no cabeçalho 'Authorization'.
 * * Valida a assinatura do Token usando o segredo do servidor.
 * * Decodifica o payload e anexa o utilizador ao objeto 'req'.
 * * @module middleware/authMiddleware
 */

const jwt = require('jsonwebtoken');

/**
 * VERIFICAR TOKEN
 * * Função principal do middleware.
 * * Se o token for válido, adiciona req.user e permite avançar (next).
 * * Se falhar, retorna erro 401 e bloqueia a requisição.
 * * @param req - Objeto da requisição (espera header Authorization: Bearer <token>)
 * * @param res - Objeto da resposta
 * * @param next - Função para passar ao próximo controlador
 */
const authMiddleware = (req, res, next) => {
  // Extrai o token removendo o prefixo "Bearer "
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  try {
    // Verifica a validade e expiração usando a chave secreta do .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Anexa os dados do utilizador à requisição para uso nos controllers
    // Isto permite que você use "req.user.id" ou "req.user.role" nas rotas seguintes
    req.user = decoded; 
    
    next(); // Continua para a rota
  } catch (error) {
    // Melhoria: Mensagem específica se o token expirou
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Sessão expirada. Por favor faça login novamente.' });
    }
    
    res.status(401).json({ message: 'Token inválido.' });
  }
};

module.exports = authMiddleware;