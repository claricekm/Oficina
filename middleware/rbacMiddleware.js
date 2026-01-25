/**
 * RBAC (Role-Based Access Control) Middleware
 * Provides role-based authorization for routes
 */

// Allow only admin users
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// Allow only mechanic users
const mechanicOnly = (req, res, next) => {
  if (req.user.role !== 'mechanic') {
    return res.status(403).json({ message: 'Acesso negado. Apenas mecânicos.' });
  }
  next();
};

// Allow only customer users
const customerOnly = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Acesso negado. Apenas clientes.' });
  }
  next();
};

// Allow admin or mechanic users
const adminOrMechanic = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'mechanic') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores ou mecânicos.' });
  }
  next();
};

// Allow admin or customer users
const adminOrCustomer = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores ou clientes.' });
  }
  next();
};

// Generic role checker - accepts array of allowed roles
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
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
