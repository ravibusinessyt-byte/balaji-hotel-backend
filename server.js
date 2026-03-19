require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// ── CORS — must be FIRST before any routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── ROUTES
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/customers',  require('./routes/customers'));
app.use('/api/banners',    require('./routes/banners'));
app.use('/api/payments',   require('./routes/payments'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/settings',   require('./routes/settings'));
app.use('/api/coupons',    require('./routes/coupons'));
app.use('/api/upload',     require('./routes/upload'));

app.get('/api/health', (_, res) => res.json({ status: 'OK', app: 'Balaji Hotel API', time: new Date() }));

// ── GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// ── MONGODB + START
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set!');
  process.exit(1);
}

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('✅ MongoDB Connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  });
