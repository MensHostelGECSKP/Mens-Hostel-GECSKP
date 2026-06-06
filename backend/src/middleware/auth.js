const jwt = require('jsonwebtoken');
const config = require('../config');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'No token provided, or invalid format.',
      code: 'NO_TOKEN'
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // Adds user payload to request
    next();
  } catch (err) {
    return res.status(401).json({ 
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
}

function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    error: 'Admin access required',
    code: 'ADMIN_REQUIRED'
  });
}

module.exports = { auth, adminOnly }; 