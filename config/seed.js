require('dotenv').config();
const mongoose = require('mongoose');
const { Admin, Category, Product, Settings, Banner } = require('../models');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Admin
  const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'admin@balajihotel.com' });
  if (!adminExists) {
    await Admin.create({ name: process.env.ADMIN_NAME || 'Balaji Hotel Admin', email: process.env.ADMIN_EMAIL || 'admin@balajihotel.com', password: process.env.ADMIN_PASSWORD || 'Admin@123456', role: 'superadmin' });
    console.log('✅ Super Admin created');
    console.log('   Email:', process.env.ADMIN_EMAIL || 'admin@balajihotel.com');
    console.log('   Password:', process.env.ADMIN_PASSWORD || 'Admin@123456');
  }

  // Settings
  const settingsExists = await Settings.findOne();
  if (!settingsExists) {
    await Settings.create({ shopName: 'Balaji Hotel', phone: '+91 99880-37238', whatsapp: '919988037238', email: 'balajihotelraikot@gmail.com', address: 'Near Sardar Hari Singh Nalwa Chowk, Raikot, Ludhiana - 141101' });
    console.log('✅ Default settings created');
  }

  // Categories
  const cats = [
    { name: 'Barfi & Fudge', slug: 'barfi-fudge', icon: '🍬', type: 'sweets', sortOrder: 1 },
    { name: 'Ladoo', slug: 'ladoo', icon: '🟡', type: 'sweets', sortOrder: 2 },
    { name: 'Halwa', slug: 'halwa', icon: '🥣', type: 'sweets', sortOrder: 3 },
    { name: 'Gulab Jamun', slug: 'gulab-jamun', icon: '🟤', type: 'sweets', sortOrder: 4 },
    { name: 'Rasgulla', slug: 'rasgulla', icon: '⚪', type: 'sweets', sortOrder: 5 },
    { name: 'Jalebi & Imarti', slug: 'jalebi', icon: '🍥', type: 'sweets', sortOrder: 6 },
    { name: 'Gift Boxes', slug: 'gift-boxes', icon: '🎁', type: 'gift', sortOrder: 7 },
    { name: 'Samosa & Kachori', slug: 'samosa-kachori', icon: '🥟', type: 'fastfood', sortOrder: 8 },
    { name: 'Chaat', slug: 'chaat', icon: '🥗', type: 'fastfood', sortOrder: 9 },
    { name: 'Snacks', slug: 'snacks', icon: '🍟', type: 'fastfood', sortOrder: 10 },
  ];
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    const created = await Category.insertMany(cats);
    console.log('✅ Categories created:', created.length);

    // Sample products
    const catMap = {};
    created.forEach(c => { catMap[c.slug] = c._id; });
    const products = [
      { name: 'Kaju Katli', slug: 'kaju-katli-'+Date.now(), category: catMap['barfi-fudge'], price: 180, mrp: 220, unit: '250g', badge: 'Bestseller', description: 'Pure cashew fudge topped with silver vark. Made fresh daily with premium kaju from Raikot\'s finest dairy.', images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Kaju_katli.jpg/480px-Kaju_katli.jpg'], isFeatured: true, tags: ['kaju','cashew','barfi'] },
      { name: 'Gulab Jamun', slug: 'gulab-jamun-'+Date.now(), category: catMap['gulab-jamun'], price: 120, mrp: 120, unit: '500g', badge: 'Pure Ghee', description: 'Soft milk-solid dumplings soaked in rose-flavoured sugar syrup. Made with pure desi ghee.', images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Gulab_jamun_%28single%29.jpg/480px-Gulab_jamun_%28single%29.jpg'], isFeatured: true },
      { name: 'Motichoor Ladoo', slug: 'motichoor-ladoo-'+Date.now(), category: catMap['ladoo'], price: 150, mrp: 150, unit: '250g', badge: 'Festival Special', description: 'Fine boondi ladoo with cardamom, pistachio and saffron. Classic festival sweet.', images: ['https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80'], isFeatured: true },
      { name: 'Pista Barfi', slug: 'pista-barfi-'+Date.now(), category: catMap['barfi-fudge'], price: 240, mrp: 280, unit: '250g', badge: 'Premium', description: 'Rich pistachio milk fudge with khoya. Premium gift favourite for all occasions.', images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Barfi_02.jpg/480px-Barfi_02.jpg'], isFeatured: false },
      { name: 'Gajar Halwa', slug: 'gajar-halwa-'+Date.now(), category: catMap['halwa'], price: 180, mrp: 180, unit: '500g', badge: 'Seasonal', description: 'Slow-cooked carrot halwa with pure ghee, milk, sugar and dry fruits. Winter special.', images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Gajar_ka_halwa.jpg/480px-Gajar_ka_halwa.jpg'], isFeatured: false },
      { name: 'Rasgulla', slug: 'rasgulla-'+Date.now(), category: catMap['rasgulla'], price: 110, mrp: 110, unit: '500g', badge: 'Bestseller', description: 'Bengali-style chenna balls in light sugar syrup. Soft, spongy and delicious.', images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Rasgulla.jpg/480px-Rasgulla.jpg'], isFeatured: false },
      { name: 'Crispy Jalebi', slug: 'jalebi-'+Date.now(), category: catMap['jalebi'], price: 80, mrp: 80, unit: '250g', badge: 'Fresh Hot', description: 'Crispy spiral fritters soaked in sugar syrup. Best served hot, made fresh every hour.', images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Jalebi_-_wikimedia_commons.jpg/480px-Jalebi_-_wikimedia_commons.jpg'], isFeatured: false },
      { name: 'Festival Gift Box', slug: 'gift-box-'+Date.now(), category: catMap['gift-boxes'], price: 399, mrp: 499, unit: '1 Box', badge: 'Gift Box', description: '6-8 premium sweets in a beautiful gift box. Fully customizable for all occasions.', images: ['https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=400&q=80'], isFeatured: true },
      { name: 'Aloo Samosa', slug: 'samosa-'+Date.now(), category: catMap['samosa-kachori'], price: 10, mrp: 10, unit: 'per pc', badge: 'Popular', description: 'Crispy pastry stuffed with spiced potato filling. Best with mint chutney.', images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Samosachutney.jpg/480px-Samosachutney.jpg'], isFeatured: false },
      { name: 'Pyaaz Kachori', slug: 'kachori-'+Date.now(), category: catMap['samosa-kachori'], price: 15, mrp: 15, unit: 'per pc', badge: 'Must Try', description: 'Flaky pastry filled with spiced onion masala. Crispy outside, flavourful inside.', images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Kachori-breakfast.jpg/480px-Kachori-breakfast.jpg'], isFeatured: false },
      { name: 'Aloo Tikki Chaat', slug: 'chaat-'+Date.now(), category: catMap['chaat'], price: 40, mrp: 40, unit: 'per plate', badge: 'Bestseller', description: 'Crispy potato tikkis topped with chutneys, yoghurt, onion and sev.', images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Dahi_Puri_chaat.jpg/480px-Dahi_Puri_chaat.jpg'], isFeatured: false },
    ];
    await Product.insertMany(products);
    console.log('✅ Products created:', products.length);
  }

  // Banner
  const bannerCount = await Banner.countDocuments();
  if (bannerCount === 0) {
    await Banner.insertMany([
      { title: 'Pure Indian Sweets', subtitle: 'Made fresh daily with pure desi ghee', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1400&q=80', link: '/shop', btnText: 'Shop Now', sortOrder: 0 },
      { title: 'Grand Weddings & Events', subtitle: 'Banquet Hall for 500+ guests', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1400&q=80', link: '/events', btnText: 'Book Now', sortOrder: 1 },
    ]);
    console.log('✅ Banners created');
  }

  console.log('\n🎉 Seed complete! Your admin login:');
  console.log('   URL:      http://localhost:5000 (or your Railway URL)');
  console.log('   Email:   ', process.env.ADMIN_EMAIL || 'admin@balajihotel.com');
  console.log('   Password:', process.env.ADMIN_PASSWORD || 'Admin@123456');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
