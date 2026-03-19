require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// ── CORS — manual headers, works without cors package
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

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// ── AUTO SEED + START SERVER
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ MongoDB Connected');

    // Auto-seed admin if not exists (runs inline, no separate process.exit)
    try {
      const { Admin, Settings } = require('./models');
      const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'admin@balajihotel.com' });
      if (!adminExists) {
        await Admin.create({
          name: process.env.ADMIN_NAME || 'Balaji Hotel Admin',
          email: process.env.ADMIN_EMAIL || 'admin@balajihotel.com',
          password: process.env.ADMIN_PASSWORD || 'Admin@123456',
          role: 'superadmin'
        });
        console.log('✅ Admin account created:', process.env.ADMIN_EMAIL);
      }
      const settingsExists = await Settings.findOne();
      if (!settingsExists) {
        await Settings.create({
          shopName: 'Balaji Hotel',
          phone: '+91 99880-37238',
          whatsapp: '919988037238',
          email: 'balajihotelraikot@gmail.com',
          address: 'Near Sardar Hari Singh Nalwa Chowk, Raikot, Ludhiana - 141101',
          codEnabled: true,
          paytmEnabled: false,
          razorpayEnabled: false,
          phonepeEnabled: false
        });
        console.log('✅ Default settings created');
      }
    } catch (seedErr) {
      console.log('⚠️ Seed skipped (non-fatal):', seedErr.message);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Balaji Hotel API running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    process.exit(1);
  }
}

startServer();
