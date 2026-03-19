# ── SERVER ──
PORT=5000
NODE_ENV=production

# ── MONGODB (Get from mongodb.com/atlas → free cluster) ──
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/balaji-hotel

# ── JWT (change this to any random long string) ──
JWT_SECRET=balaji_hotel_super_secret_key_change_this_2024
JWT_EXPIRE=30d

# ── CLOUDINARY (free image hosting → cloudinary.com) ──
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── PAYTM (business.paytm.com → Sign up as merchant) ──
PAYTM_MERCHANT_ID=your_paytm_merchant_id
PAYTM_MERCHANT_KEY=your_paytm_merchant_key
PAYTM_INDUSTRY_TYPE=Retail
PAYTM_ENV=PROD

# ── PHONEPE (phonepe.com/business) — OPTIONAL ──
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_SALT_KEY=your_salt_key
PHONEPE_SALT_INDEX=1
PHONEPE_ENV=PROD

# ── FRONTEND URL (your netlify/vercel link after deploy) ──
FRONTEND_URL=https://balajiwale.in
ADMIN_URL=https://admin.balajiwale.in

# ── FIRST ADMIN (used by seed script) ──
ADMIN_NAME=Balaji Hotel Admin
ADMIN_EMAIL=admin@balajihotel.com
ADMIN_PASSWORD=Admin@123456

