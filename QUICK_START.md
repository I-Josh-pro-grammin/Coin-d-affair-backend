# Quick Start Guide 🚀

## What's Been Done ✅

Your marketplace backend has been fully set up with a complete Supabase database:

- ✅ **18 database tables** created with full schema
- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **50+ security policies** configured
- ✅ **PostGIS extension** enabled for location features
- ✅ **Pre-populated data**: 8 Rwanda cities
- ✅ **Environment configuration** updated
- ✅ **Complete documentation** provided

## Get Started in 3 Steps

### Step 1: Get Your Database Password

1. Visit [Supabase Dashboard](https://supabase.com/dashboard/project/iiggekhcnlnlcfqncogn/settings/database)
2. Scroll to **Connection string** section
3. Click **Show password** or copy the password
4. Open `.env` file and update:
   ```
   DB_PASSWORD=your-actual-password-here
   ```

### Step 2: Install & Test

```bash
# Install dependencies (already done)
npm install

# Test database connection
node -e "import('./src/config/database.js').then(m => m.default.query('SELECT NOW(), COUNT(*) as tables FROM information_schema.tables WHERE table_schema=\'public\'').then(r => console.log('✅ Connected! Time:', r.rows[0].now, '| Tables:', r.rows[0].tables)).catch(e => console.error('❌ Error:', e.message)))"
```

### Step 3: Start the Backend

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Your API will be available at: `http://localhost:5000`

## API Documentation

Once the server is running:
- **Swagger UI**: http://localhost:5000/public/swagger.html
- **Swagger JSON**: http://localhost:5000/api/swagger.json

## Database Tables Overview

### User Management
- `users` - User accounts (customer, business, admin)
- `addresses` - Shipping/billing addresses
- `locations` - City/area references

### Business & Products
- `businesses` - Business accounts
- `categories` / `subcategories` - Product organization
- `listings` - Product listings
- `listing_media` - Product images/videos
- `sku_items` / `variant_types` / `variant_values` - Product variants

### E-Commerce
- `carts` / `cart_items` - Shopping carts
- `orders` / `order_items` - Order management
- `payments` - Payment tracking

### Admin
- `admin_logs` - Activity logging
- `admin_notifications` - User notifications

## Testing the API

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "accountType": "user",
    "phone": "+250788000000"
  }'
```

### Get All Products
```bash
curl http://localhost:5000/api/products/get-products
```

### Get Categories
```bash
curl http://localhost:5000/api/category
```

## Environment Variables to Configure

### Required for Basic Functionality
- ✅ `DB_PASSWORD` - Get from Supabase dashboard

### Optional (for full functionality)
- ⚠️ `EMAIL_SENDER` / `APP_PASSWORD` - For email verification
- ⚠️ `CLOUDINARY_*` - For image uploads
- ⚠️ `STRIPE_*` - For payment processing

## Common Issues & Solutions

### Issue: "password authentication failed"
**Solution**: Get the correct database password from Supabase dashboard and update `.env`

### Issue: "relation does not exist"
**Solution**: Database tables are already created. Check your connection is to the right project.

### Issue: Port 5000 already in use
**Solution**: Change `PORT` in `.env` to another port (e.g., 3000, 8000)

### Issue: Cloudinary upload fails
**Solution**: Configure Cloudinary credentials in `.env` or skip image uploads for testing

## Next Steps

1. ✅ Get database password and test connection
2. ⚠️ Configure email service (optional, for user verification)
3. ⚠️ Configure Cloudinary (optional, for product images)
4. ⚠️ Configure Stripe (optional, for payments)
5. ✅ Create an admin user account
6. ✅ Add product categories
7. ✅ Create test product listings

## Database Connection Alternatives

If you prefer using Supabase JS client instead of raw PostgreSQL:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Query example
const { data, error } = await supabase
  .from('listings')
  .select('*, listing_media(*)')
  .order('created_at', { ascending: false })
  .limit(10)
```

## Useful Commands

```bash
# Check database tables
node -e "import('./src/config/database.js').then(m => m.default.query('SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\' ORDER BY table_name').then(r => console.log(r.rows.map(t => t.table_name).join(', '))))"

# Count locations
node -e "import('./src/config/database.js').then(m => m.default.query('SELECT * FROM locations').then(r => console.log('Locations:', r.rows)))"

# Test RLS
node -e "import('./src/config/database.js').then(m => m.default.query('SELECT COUNT(*) FROM users').then(r => console.log('Total users:', r.rows[0].count)))"
```

## Documentation Files

- 📄 `SUPABASE_SETUP.md` - Complete setup guide
- 📄 `DATABASE_SCHEMA.md` - Detailed schema documentation
- 📄 `QUICK_START.md` - This file

## Support

If you encounter issues:
1. Check `.env` configuration
2. Verify database password is correct
3. Ensure port 5000 is available
4. Review error logs in console

## Supabase Dashboard

Access your database directly:
- **Project URL**: https://supabase.com/dashboard/project/iiggekhcnlnlcfqncogn
- **Database**: Settings → Database
- **Table Editor**: Table Editor
- **SQL Editor**: SQL Editor

---

**Status**: ✅ Database ready | ⚠️ Need DB password to start backend

**Project ID**: `iiggekhcnlnlcfqncogn`
**Database**: PostgreSQL 17.6
**Region**: US East
