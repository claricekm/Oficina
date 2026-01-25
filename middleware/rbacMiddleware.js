/**
 * MIDDLEWARE DE CONTROLO DE ACESSO (RBAC)
 * * Define permissões baseadas em cargos (roles).
 * * Deve ser usado SEMPRE depois do 'authMiddleware', pois depende de 'req.user'.
 * * @module middleware/roleMiddleware
 */

/**
 * APENAS ADMIN
 * * Bloqueia qualquer utilizador que não seja administrador.
 * * Usado para rotas sensíveis (criar serviços, gerir staff, ver faturação).
 * * @param req - Objeto da requisição (deve conter req.user)
 * * @param res - Objeto da resposta
 * * @param next - Próximo passo
 */
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

/**
 * APENAS MECÂNICO
 * * Exclusivo para funcionários da oficina.
 * * Usado para ver agenda de trabalho ou atualizar estado de reparações.
 */
const mechanicOnly = (req, res, next) => {
  if (req.user.role !== 'mechanic') {
    return res.status(403).json({ message: 'Acesso negado. Apenas mecânicos.' });
  }
  next();
};

/**
 * APENAS CLIENTE
 * * Exclusivo para utilizadores finais.
 * * Usado para criar marcações, avaliar serviços ou ver os seus próprios veículos.
 */
const customerOnly = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Acesso negado. Apenas clientes.' });
  }
  next();
};

/**
 * ADMIN OU MECÂNICO (Staff)
 * * Permite acesso a qualquer membro da equipa da oficina.
 * * Útil para listagens de agendamentos ou visualização de detalhes técnicos.
 */
const adminOrMechanic = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'mechanic') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores ou mecânicos.' });
  }
  next();
};

/**
 * ADMIN OU CLIENTE
 * * Útil para rotas onde o cliente gere os seus dados, mas o Admin também tem poder
 * * de intervenção (ex: cancelar uma marcação a pedido).
 */
const adminOrCustomer = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores ou clientes.' });
  }
  next();
};

/**
 * VERIFICADOR GENÉRICO DE CARGOS
 * * Função fábrica (Factory Function) que cria um middleware dinâmico.
 * * Permite passar uma lista de cargos permitidos na hora de definir a rota.
 * * Exemplo de uso: router.get('/rota', requireRole('admin', 'customer'), controller)
 * * @param ...allowedRoles - Lista de strings com os cargos permitidos (ex: 'admin', 'mechanic')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Verifica se o cargo do utilizador está na lista de permitidos
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Acesso negado. Roles permitidos: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
};

module.exports = {
  adminOnly,
  mechanicOnly,
  customerOnly,
  adminOrMechanic,
  adminOrCustomer,
  requireRole
};