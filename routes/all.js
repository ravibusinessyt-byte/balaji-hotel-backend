// ═══════════════════════════════════════════════
// AUTH ROUTES — /api/auth
// ═══════════════════════════════════════════════
const authRouter = require('express').Router();
const { Admin } = require('../models');
const { generateToken, protectAdmin } = require('../middleware/auth');

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (!admin.isActive) return res.status(401).json({ message: 'Account disabled' });
    admin.lastLogin = new Date(); await admin.save();
    res.json({ _id: admin._id, name: admin.name, email: admin.email, role: admin.role, token: generateToken(admin._id, admin.role) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

authRouter.post('/register', async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    const role = count === 0 ? 'superadmin' : 'admin';
    const admin = await Admin.create({ ...req.body, role });
    res.status(201).json({ _id: admin._id, name: admin.name, email: admin.email, role: admin.role, token: generateToken(admin._id, admin.role) });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

authRouter.get('/me', protectAdmin, (req, res) => res.json(req.admin));

authRouter.put('/password', protectAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!(await admin.matchPassword(req.body.currentPassword)))
      return res.status(400).json({ message: 'Current password incorrect' });
    admin.password = req.body.newPassword;
    await admin.save();
    res.json({ message: 'Password updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports.authRouter = authRouter;

// ═══════════════════════════════════════════════
// CATEGORIES — /api/categories
// ═══════════════════════════════════════════════
const catRouter = require('express').Router();
const { Category } = require('../models');
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

catRouter.get('/', async (req, res) => {
  try { res.json(await Category.find({ isActive: true }).sort('sortOrder')); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
catRouter.get('/all', protectAdmin, async (req, res) => {
  try { res.json(await Category.find().sort('sortOrder')); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
catRouter.post('/', protectAdmin, async (req, res) => {
  try { res.status(201).json(await Category.create({ ...req.body, slug: slugify(req.body.name) })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});
catRouter.put('/:id', protectAdmin, async (req, res) => {
  try {
    if (req.body.name) req.body.slug = slugify(req.body.name);
    res.json(await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }));
  } catch (e) { res.status(400).json({ message: e.message }); }
});
catRouter.delete('/:id', protectAdmin, async (req, res) => {
  try { await Category.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports.catRouter = catRouter;

// ═══════════════════════════════════════════════
// PRODUCTS — /api/products
// ═══════════════════════════════════════════════
const prodRouter = require('express').Router();
const { Product } = require('../models');

prodRouter.get('/', async (req, res) => {
  try {
    const { cat, featured, search, sort = '-createdAt', limit = 20, page = 1 } = req.query;
    const q = { isActive: true };
    if (cat) q.category = cat;
    if (featured === 'true') q.isFeatured = true;
    if (search) q.name = { $regex: search, $options: 'i' };
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(q).populate('category', 'name slug icon').sort(sort).skip(+skip).limit(+limit),
      Product.countDocuments(q)
    ]);
    res.json({ products, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

prodRouter.get('/admin', protectAdmin, async (req, res) => {
  try {
    const { search, cat, page = 1, limit = 20 } = req.query;
    const q = {};
    if (search) q.name = { $regex: search, $options: 'i' };
    if (cat) q.category = cat;
    const [products, total] = await Promise.all([
      Product.find(q).populate('category', 'name').sort('-createdAt').skip((page-1)*limit).limit(+limit),
      Product.countDocuments(q)
    ]);
    res.json({ products, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

prodRouter.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

prodRouter.post('/', protectAdmin, async (req, res) => {
  try {
    const slug = slugify(req.body.name) + '-' + Date.now();
    res.status(201).json(await Product.create({ ...req.body, slug }));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

prodRouter.put('/:id', protectAdmin, async (req, res) => {
  try { res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

prodRouter.delete('/:id', protectAdmin, async (req, res) => {
  try { await Product.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

prodRouter.patch('/:id/toggle', protectAdmin, async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    p[req.body.field] = !p[req.body.field];
    await p.save(); res.json(p);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports.prodRouter = prodRouter;

// ═══════════════════════════════════════════════
// ORDERS — /api/orders
// ═══════════════════════════════════════════════
const orderRouter = require('express').Router();
const { Order, Customer } = require('../models');

orderRouter.get('/', protectAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search, date } = req.query;
    const q = {};
    if (status) q.status = status;
    if (search) q.$or = [{ orderNumber: { $regex: search, $options: 'i' } }, { 'customer.phone': { $regex: search } }];
    if (date) { const d = new Date(date); q.createdAt = { $gte: d, $lt: new Date(d.getTime() + 86400000) }; }
    const [orders, total] = await Promise.all([
      Order.find(q).sort('-createdAt').skip((page-1)*limit).limit(+limit),
      Order.countDocuments(q)
    ]);
    res.json({ orders, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

orderRouter.get('/:id', protectAdmin, async (req, res) => {
  try {
    const o = await Order.findById(req.params.id);
    if (!o) return res.status(404).json({ message: 'Not found' });
    res.json(o);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

orderRouter.post('/', async (req, res) => {
  try {
    const order = await Order.create(req.body);
    // Update customer stats
    if (req.body.customer?.userId) {
      await Customer.findByIdAndUpdate(req.body.customer.userId, {
        $inc: { totalOrders: 1, totalSpent: req.body.total },
        lastOrderAt: new Date()
      });
    }
    res.status(201).json(order);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

orderRouter.patch('/:id/status', protectAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });
    order.status = status;
    order.history.push({ status, note: note || '' });
    await order.save();
    res.json(order);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

orderRouter.patch('/:id/payment', protectAdmin, async (req, res) => {
  try {
    const o = await Order.findByIdAndUpdate(req.params.id,
      { paymentStatus: req.body.paymentStatus, 'paymentDetails.paidAt': new Date() },
      { new: true });
    res.json(o);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports.orderRouter = orderRouter;

// ═══════════════════════════════════════════════
// CUSTOMERS — /api/customers
// ═══════════════════════════════════════════════
const custRouter = require('express').Router();

custRouter.get('/', protectAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const q = {};
    if (search) q.$or = [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search } }];
    const [customers, total] = await Promise.all([
      Customer.find(q).select('-password').sort('-createdAt').skip((page-1)*limit).limit(+limit),
      Customer.countDocuments(q)
    ]);
    res.json({ customers, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

custRouter.get('/:id', protectAdmin, async (req, res) => {
  try {
    const c = await Customer.findById(req.params.id).select('-password');
    if (!c) return res.status(404).json({ message: 'Not found' });
    const orders = await Order.find({ 'customer.userId': c._id }).sort('-createdAt').limit(10);
    res.json({ customer: c, orders });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

custRouter.patch('/:id/toggle', protectAdmin, async (req, res) => {
  try {
    const c = await Customer.findById(req.params.id);
    c.isActive = !c.isActive; await c.save(); res.json(c);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports.custRouter = custRouter;

// ═══════════════════════════════════════════════
// BANNERS — /api/banners
// ═══════════════════════════════════════════════
const bannerRouter = require('express').Router();
const { Banner } = require('../models');

bannerRouter.get('/', async (req, res) => {
  try { res.json(await Banner.find({ isActive: true }).sort('sortOrder')); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
bannerRouter.get('/all', protectAdmin, async (req, res) => {
  try { res.json(await Banner.find().sort('sortOrder')); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
bannerRouter.post('/', protectAdmin, async (req, res) => {
  try { res.status(201).json(await Banner.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});
bannerRouter.put('/:id', protectAdmin, async (req, res) => {
  try { res.json(await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});
bannerRouter.delete('/:id', protectAdmin, async (req, res) => {
  try { await Banner.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports.bannerRouter = bannerRouter;

// ═══════════════════════════════════════════════
// DASHBOARD — /api/dashboard
// ═══════════════════════════════════════════════
const dashRouter = require('express').Router();

dashRouter.get('/stats', protectAdmin, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const month = new Date(today.getFullYear(), today.getMonth(), 1);
    const [totalOrders, todayOrders, pendingOrders, paidRevenue, monthRevenue, totalProducts, totalCustomers, recentOrders, topProducts] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: month } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Product.countDocuments({ isActive: true }),
      Customer.countDocuments(),
      Order.find().sort('-createdAt').limit(8),
      Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.name', count: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { count: -1 } }, { $limit: 5 }
      ])
    ]);
    const last7 = new Date(); last7.setDate(last7.getDate() - 7);
    const chartData = await Order.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ totalOrders, todayOrders, pendingOrders, totalRevenue: paidRevenue[0]?.total || 0, monthRevenue: monthRevenue[0]?.total || 0, totalProducts, totalCustomers, recentOrders, topProducts, chartData });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports.dashRouter = dashRouter;

// ═══════════════════════════════════════════════
// SETTINGS — /api/settings
// ═══════════════════════════════════════════════
const settingsRouter = require('express').Router();
const { Settings } = require('../models');

settingsRouter.get('/', async (req, res) => {
  try {
    let s = await Settings.findOne();
    if (!s) s = await Settings.create({});
    // Don't expose secrets to frontend
    const safe = s.toObject();
    if (!req.headers.authorization) {
      delete safe.razorpaySecret;
      delete safe.phonepeSaltKey;
      delete safe.cloudinarySecret;
    }
    res.json(safe);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

settingsRouter.put('/', protectAdmin, async (req, res) => {
  try {
    let s = await Settings.findOne();
    if (!s) s = new Settings();
    Object.assign(s, req.body);
    await s.save(); res.json(s);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports.settingsRouter = settingsRouter;

// ═══════════════════════════════════════════════
// COUPONS — /api/coupons
// ═══════════════════════════════════════════════
const couponRouter = require('express').Router();
const { Coupon } = require('../models');

couponRouter.get('/', protectAdmin, async (req, res) => {
  try { res.json(await Coupon.find().sort('-createdAt')); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
couponRouter.post('/validate', async (req, res) => {
  try {
    const c = await Coupon.findOne({ code: req.body.code.toUpperCase(), isActive: true });
    if (!c) return res.status(404).json({ message: 'Invalid coupon code' });
    if (c.expiresAt && c.expiresAt < new Date()) return res.status(400).json({ message: 'Coupon expired' });
    if (c.usedCount >= c.usageLimit) return res.status(400).json({ message: 'Coupon usage limit reached' });
    if (req.body.orderValue < c.minOrder) return res.status(400).json({ message: `Minimum order ₹${c.minOrder} required` });
    let discount = c.type === 'percent' ? (req.body.orderValue * c.value / 100) : c.value;
    if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
    res.json({ valid: true, discount: Math.round(discount), code: c.code, type: c.type, value: c.value });
  } catch (e) { res.status(500).json({ message: e.message }); }
});
couponRouter.post('/', protectAdmin, async (req, res) => {
  try { res.status(201).json(await Coupon.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});
couponRouter.put('/:id', protectAdmin, async (req, res) => {
  try { res.json(await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});
couponRouter.delete('/:id', protectAdmin, async (req, res) => {
  try { await Coupon.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports.couponRouter = couponRouter;

// ═══════════════════════════════════════════════
// PAYMENTS — /api/payments
// ═══════════════════════════════════════════════
const payRouter = require('express').Router();
const crypto = require('crypto');

// Razorpay
payRouter.post('/razorpay/create', async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const s = await Settings.findOne();
    const rzp = new Razorpay({ key_id: s?.razorpayKeyId || process.env.RAZORPAY_KEY_ID, key_secret: s?.razorpaySecret || process.env.RAZORPAY_KEY_SECRET });
    const order = await rzp.orders.create({ amount: Math.round(req.body.amount * 100), currency: 'INR', receipt: req.body.orderId });
    res.json({ success: true, order, key: s?.razorpayKeyId || process.env.RAZORPAY_KEY_ID });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

payRouter.post('/razorpay/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const s = await Settings.findOne();
    const secret = s?.razorpaySecret || process.env.RAZORPAY_KEY_SECRET;
    const sig = crypto.createHmac('sha256', secret).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
    if (sig !== razorpay_signature) return res.status(400).json({ success: false, message: 'Verification failed' });
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid', paymentMethod: 'razorpay', status: 'confirmed',
      'paymentDetails.razorpayOrderId': razorpay_order_id,
      'paymentDetails.razorpayPaymentId': razorpay_payment_id,
      'paymentDetails.paidAt': new Date()
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PhonePe
payRouter.post('/phonepe/initiate', async (req, res) => {
  try {
    const { amount, orderId, phone } = req.body;
    const s = await Settings.findOne();
    const mId = s?.phonepeMerchantId || process.env.PHONEPE_MERCHANT_ID;
    const saltKey = s?.phonepeSaltKey || process.env.PHONEPE_SALT_KEY;
    const saltIdx = process.env.PHONEPE_SALT_INDEX || 1;
    const payload = { merchantId: mId, merchantTransactionId: orderId, merchantUserId: 'U' + phone, amount: amount * 100, redirectUrl: `${process.env.FRONTEND_URL}/order-success?orderId=${orderId}`, redirectMode: 'REDIRECT', callbackUrl: `${process.env.FRONTEND_URL}/order-success?orderId=${orderId}`, mobileNumber: phone, paymentInstrument: { type: 'PAY_PAGE' } };
    const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = crypto.createHash('sha256').update(base64 + '/pg/v1/pay' + saltKey).digest('hex') + '###' + saltIdx;
    const env = process.env.PHONEPE_ENV === 'PROD' ? 'api.phonepe.com/apis/hermes' : 'api-preprod.phonepe.com/apis/pg-sandbox';
    const r = await fetch(`https://${env}/pg/v1/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-VERIFY': checksum }, body: JSON.stringify({ request: base64 }) });
    res.json({ success: true, data: await r.json() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports.payRouter = payRouter;

// ═══════════════════════════════════════════════
// UPLOAD — /api/upload
// ═══════════════════════════════════════════════
const uploadRouter = require('express').Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

uploadRouter.post('/image', protectAdmin, upload.single('image'), async (req, res) => {
  try {
    const s = await Settings.findOne();
    cloudinary.config({
      cloud_name: s?.cloudinaryCloud || process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    s?.cloudinaryKey || process.env.CLOUDINARY_API_KEY,
      api_secret: s?.cloudinarySecret || process.env.CLOUDINARY_API_SECRET
    });
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, { folder: 'balaji-hotel', quality: 'auto', fetch_format: 'auto' });
    res.json({ success: true, url: result.secure_url, public_id: result.public_id });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports.uploadRouter = uploadRouter;
