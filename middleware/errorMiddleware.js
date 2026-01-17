const errorMiddleware = (err, req, res, next) => {
  console.error('Erro:', err.message);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor'
  });
};

module.exports = errorMiddleware;
