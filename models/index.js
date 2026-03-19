const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── ADMIN ──────────────────────────────────────────────
const adminSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['superadmin','admin'], default: 'admin' },
  isActive:  { type: Boolean, default: true },
  lastLogin: Date
}, { timestamps: true });

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
adminSchema.methods.matchPassword = async function(p) {
  return bcrypt.compare(p, this.password);
};

// ── CATEGORY ───────────────────────────────────────────
const categorySchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  slug:        { type: String, required: true, unique: true },
  description: String,
  image:       String,
  icon:        { type: String, default: '🍯' },
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
  type:        { type: String, enum: ['sweets','fastfood','events','gift'], default: 'sweets' }
}, { timestamps: true });

// ── PRODUCT ────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images:      [String],
  price:       { type: Number, required: true, min: 0 },
  mrp:         { type: Number, min: 0 },
  unit:        { type: String, default: '250g' },
  stock:       { type: Number, default: 999 },
  badge:       { type: String, enum: ['','Bestseller','New','Sale','Premium','Festival Special','Pure Ghee','Popular','Must Try'], default: '' },
  isActive:    { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false },
  sortOrder:   { type: Number, default: 0 },
  tags:        [String],
  rating:      { type: Number, default: 4.5 },
  reviews:     { type: Number, default: 0 }
}, { timestamps: true });

// ── CUSTOMER ───────────────────────────────────────────
const customerSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  phone:     { type: String, required: true, unique: true },
  email:     { type: String, lowercase: true, sparse: true },
  password:  String,
  addresses: [{
    label:    { type: String, default: 'Home' },
    line1:    String,
    line2:    String,
    city:     { type: String, default: 'Raikot' },
    state:    { type: String, default: 'Punjab' },
    pincode:  String,
    isDefault:{ type: Boolean, default: false }
  }],
  isActive:     { type: Boolean, default: true },
  totalOrders:  { type: Number, default: 0 },
  totalSpent:   { type: Number, default: 0 },
  lastOrderAt:  Date
}, { timestamps: true });

// ── ORDER ──────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: {
    name:   { type: String, required: true },
    phone:  { type: String, required: true },
    email:  String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    quantity:  { type: Number, required: true, min: 1 },
    image:     String,
    unit:      String
  }],
  address: {
    line1:   String,
    line2:   String,
    city:    { type: String, default: 'Raikot' },
    state:   { type: String, default: 'Punjab' },
    pincode: String
  },
  subtotal:     { type: Number, required: true },
  deliveryFee:  { type: Number, default: 50 },
  discount:     { type: Number, default: 0 },
  total:        { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'],
    default: 'pending'
  },
  paymentStatus: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['razorpay','phonepe','paytm','cod'], default: 'cod' },
  paymentDetails: {
    razorpayOrderId:   String,
    razorpayPaymentId: String,
    phonepeTransId:    String,
    paytmOrderId:      String,
    paytmTransId:      String,
    paidAt:            Date
  },
  notes:   String,
  history: [{
    status:  String,
    note:    String,
    time:    { type: Date, default: Date.now }
  }]
}, { timestamps: true });

orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = 'BH' + String(count + 1001).padStart(5, '0');
  }
  next();
});

// ── BANNER ─────────────────────────────────────────────
const bannerSchema = new mongoose.Schema({
  title:      String,
  subtitle:   String,
  image:      { type: String, required: true },
  link:       { type: String, default: '/shop' },
  btnText:    { type: String, default: 'Shop Now' },
  isActive:   { type: Boolean, default: true },
  sortOrder:  { type: Number, default: 0 }
}, { timestamps: true });

// ── SETTINGS ───────────────────────────────────────────
const settingsSchema = new mongoose.Schema({
  shopName:         { type: String, default: 'Balaji Hotel' },
  tagline:          { type: String, default: 'Pure & Traditional Indian Sweets' },
  phone:            { type: String, default: '+91 99880-37238' },
  whatsapp:         { type: String, default: '919988037238' },
  email:            { type: String, default: 'balajihotelraikot@gmail.com' },
  address:          { type: String, default: 'Near Sardar Hari Singh Nalwa Chowk, Raikot, Ludhiana - 141101' },
  logo:             String,
  heroImages:       [String],
  deliveryFee:      { type: Number, default: 50 },
  freeDeliveryAbove:{ type: Number, default: 500 },
  minOrderValue:    { type: Number, default: 100 },
  razorpayEnabled:  { type: Boolean, default: false },
  razorpayKeyId:    String,
  razorpaySecret:   String,
  phonepeEnabled:   { type: Boolean, default: false },
  phonepeMerchantId:String,
  phonepeSaltKey:   String,
  codEnabled:       { type: Boolean, default: true },
  paytmEnabled:     { type: Boolean, default: true },
  paytmMerchantId:  String,
  paytmMerchantKey: String,
  paytmIndustryType:{ type: String, default: 'Retail' },
  paytmEnv:         { type: String, default: 'PROD' },
  facebook:         String,
  instagram:        String,
  youtube:          String,
  metaTitle:        String,
  metaDescription:  String,
  announcements:    { type: String, default: '🎉 Booking Open for Marriages & All Occasions — Call +91 99880-37238' },
  openingHours:     { type: String, default: '7:00 AM – 10:00 PM (All Days)' },
  cloudinaryCloud:  String,
  cloudinaryKey:    String,
  cloudinarySecret: String
}, { timestamps: true });

// ── COUPON ─────────────────────────────────────────────
const couponSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true },
  type:          { type: String, enum: ['percent','fixed'], default: 'percent' },
  value:         { type: Number, required: true },
  minOrder:      { type: Number, default: 0 },
  maxDiscount:   Number,
  usageLimit:    { type: Number, default: 100 },
  usedCount:     { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true },
  expiresAt:     Date
}, { timestamps: true });

module.exports = {
  Admin:    mongoose.model('Admin',    adminSchema),
  Category: mongoose.model('Category', categorySchema),
  Product:  mongoose.model('Product',  productSchema),
  Customer: mongoose.model('Customer', customerSchema),
  Order:    mongoose.model('Order',    orderSchema),
  Banner:   mongoose.model('Banner',   bannerSchema),
  Settings: mongoose.model('Settings', settingsSchema),
  Coupon:   mongoose.model('Coupon',   couponSchema)
};
