const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const protectAdmin = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized' });
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select('-password');
    if (!req.admin?.isActive) return res.status(401).json({ message: 'Account disabled' });
    next();
  } catch { res.status(401).json({ message: 'Token invalid or expired' }); }
};

const superAdminOnly = (req, res, next) => {
  if (req.admin?.role !== 'superadmin') return res.status(403).json({ message: 'Super admin only' });
  next();
};

module.exports = { generateToken, protectAdmin, superAdminOnly };
