# Database Schema Documentation

## Complete Schema Overview

### Tables Summary
| Table | Purpose | Row Count | RLS Enabled |
|-------|---------|-----------|-------------|
| users | User accounts | 0 | ✅ |
| locations | City/area references | 8 | ✅ |
| addresses | User addresses | 0 | ✅ |
| businesses | Business accounts | 0 | ✅ |
| categories | Product categories | 0 | ✅ |
| subcategories | Product subcategories | 0 | ✅ |
| listings | Product listings | 0 | ✅ |
| listing_media | Product media files | 0 | ✅ |
| sku_items | Product variants | 0 | ✅ |
| variant_types | Variant definitions | 0 | ✅ |
| variant_values | Variant options | 0 | ✅ |
| carts | Shopping carts | 0 | ✅ |
| cart_items | Cart contents | 0 | ✅ |
| orders | Order records | 0 | ✅ |
| order_items | Order line items | 0 | ✅ |
| payments | Payment records | 0 | ✅ |
| admin_logs | Admin activity logs | 0 | ✅ |
| admin_notifications | User notifications | 0 | ✅ |

---

## Detailed Table Structures

### 1. Users Table
**Purpose**: Store user accounts for customers, businesses, and administrators

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  full_name TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  account_type account_type DEFAULT 'user',  -- enum: user, business, admin
  verifytoken TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `idx_users_email` on `email`
- `idx_users_account_type` on `account_type`

**RLS Policies**:
- Users can read their own data
- Users can update their own data
- Public can register (insert)

---

### 2. Locations Table
**Purpose**: Store city/area names for product locations

```sql
CREATE TABLE locations (
  location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Pre-populated Data**: 8 Rwanda cities (Kigali, Butare, Gisenyi, Ruhengeri, Cyangugu, Muhanga, Byumba, Kibuye)

**RLS Policies**:
- Publicly readable
- Only admins can manage

---

### 3. Addresses Table
**Purpose**: Store user shipping and billing addresses with geographic coordinates

```sql
CREATE TABLE addresses (
  address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  label TEXT,
  street TEXT,
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'Rwanda',
  location GEOGRAPHY(POINT, 4326),  -- PostGIS geography type
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Features**:
- PostGIS geography support for location-based queries
- Cascades delete when user is deleted

**RLS Policies**:
- Users can manage their own addresses
- Each user can CRUD their addresses

---

### 4. Businesses Table
**Purpose**: Store business account information and subscription details

```sql
CREATE TABLE businesses (
  business_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  vat_number TEXT,
  subscription_plan TEXT DEFAULT 'free',
  is_paid BOOLEAN DEFAULT FALSE,
  subscription_start TIMESTAMP DEFAULT NOW(),
  subscription_period_end TIMESTAMP,
  total_orders INTEGER DEFAULT 0,
  total_sales NUMERIC(10,2) DEFAULT 0.00,
  rating NUMERIC(3,2) DEFAULT 0.00,
  stripe_account_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Features**:
- One business per user (unique constraint on user_id)
- Subscription management with start and end dates
- Sales tracking and rating system
- Stripe integration support

**RLS Policies**:
- Business owners can read/update their business
- Publicly readable (for product listings)
- Admins can manage all businesses

---

### 5. Categories & Subcategories Tables
**Purpose**: Organize products into categories and subcategories with bilingual support

```sql
CREATE TABLE categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  name_fr TEXT,  -- French translation
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subcategories (
  subcategory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
  subcategory_name TEXT NOT NULL,
  name_fr TEXT,  -- French translation
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Features**:
- Bilingual support (English and French)
- SEO-friendly slugs
- Icon support for categories
- Hierarchical structure

**RLS Policies**:
- Publicly readable
- Only admins can manage

---

### 6. Listings Table
**Purpose**: Store product listings with comprehensive details

```sql
CREATE TABLE listings (
  listings_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(business_id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(category_id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  condition TEXT,
  is_negotiable BOOLEAN DEFAULT FALSE,
  can_deliver BOOLEAN DEFAULT FALSE,
  stock INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}',
  location_id UUID REFERENCES locations(location_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Features**:
- Multiple currency support (USD, RWF, etc.)
- JSONB attributes for flexible product specifications
- Stock management
- Full-text search on title and description
- Location references

**Indexes**:
- Full-text search: `idx_listings_title_search`, `idx_listings_description_search`
- Foreign keys: seller, business, category, subcategory, location
- Query optimization: price, created_at

**RLS Policies**:
- Publicly readable (marketplace browsing)
- Sellers can manage their own listings
- Admins can manage all listings

---

### 7. Listing Media Table
**Purpose**: Store product images and videos with Cloudinary URLs

```sql
CREATE TABLE listing_media (
  listing_media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(listings_id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Features**:
- Supports images and videos
- Cloudinary integration
- Sortable display order
- Metadata storage (public_id, etc.)

**RLS Policies**:
- Publicly readable
- Listing owners can manage media

---

### 8-10. Product Variants Tables
**Purpose**: Support product variations (size, color, etc.)

```sql
CREATE TABLE sku_items (
  sku_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(listings_id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE variant_types (
  variant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(listings_id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL
);

CREATE TABLE variant_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_type_id UUID NOT NULL REFERENCES variant_types(variant_id) ON DELETE CASCADE,
  value TEXT NOT NULL
);
```

---

### 11-12. Shopping Cart Tables
**Purpose**: Manage shopping carts for logged-in and guest users

```sql
CREATE TABLE carts (
  cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  session_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT cart_user_or_session CHECK (
    (user_id IS NOT NULL AND session_token IS NULL) OR
    (user_id IS NULL AND session_token IS NOT NULL)
  )
);

CREATE TABLE cart_items (
  cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(cart_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listings_id) ON DELETE CASCADE,
  sku_item_id UUID REFERENCES sku_items(sku_item_id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_add NUMERIC(10,2) NOT NULL,
  added_at TIMESTAMP DEFAULT NOW()
);
```

**Features**:
- Supports both logged-in users and guests
- Stores price at time of adding
- Quantity validation

---

### 13-14. Orders Tables
**Purpose**: Manage orders and order items

```sql
CREATE TABLE orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  shipping_address_id UUID REFERENCES addresses(address_id) ON DELETE SET NULL,
  billing_address_id UUID REFERENCES addresses(address_id) ON DELETE SET NULL,
  is_guest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listings_id) ON DELETE RESTRICT,
  sku_item_id UUID REFERENCES sku_items(sku_item_id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);
```

**Features**:
- Guest order support
- Order status tracking (pending, processing, shipped, delivered, cancelled)
- Separate buyer and seller tracking
- Address references for shipping and billing

**RLS Policies**:
- Buyers can view their orders
- Sellers can view their sales
- Sellers and admins can update order status

---

### 15. Payments Table
**Purpose**: Track payments and Stripe transactions

```sql
CREATE TABLE payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  recipient_type TEXT,
  recipient_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Features**:
- Multi-provider support (Stripe, etc.)
- Status tracking (pending, success, failed, refunded)
- Recipient tracking (business or platform)
- Metadata storage for provider-specific data

---

### 16-17. Admin Tables
**Purpose**: Admin activity logging and user notifications

```sql
CREATE TABLE admin_logs (
  log_id SERIAL PRIMARY KEY,
  admin_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(255),
  resource_id VARCHAR(255),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admin_notifications (
  notification_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  target_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Features**:
- Comprehensive admin action logging
- User notification system
- Read/unread tracking
- JSONB metadata for flexibility

---

## Security Model

### Row Level Security (RLS)

All tables have RLS enabled with comprehensive policies:

1. **Data Isolation**: Users can only access their own data
2. **Public Browsing**: Products, categories, and locations are publicly readable
3. **Admin Override**: Admins have full access to all data
4. **Business Separation**: Business owners can only manage their business and products
5. **Guest Support**: Guest carts and orders supported with session tokens

### Authentication Flow

1. User registers → `users` table
2. Email verification → `verifytoken` field
3. Business registration → `businesses` table
4. JWT token generation → `account_type` included

### Authorization Levels

- **Public** (unauthenticated): Browse products, categories, locations
- **User** (authenticated): Manage own profile, addresses, carts, orders
- **Business** (authenticated): All user permissions + manage business, listings, orders
- **Admin** (authenticated): Full access to all data and management functions

---

## Indexes & Performance

### Full-Text Search
- Title and description search on listings
- GIN indexes for fast text queries

### Foreign Key Indexes
- All foreign key columns indexed
- Optimizes JOIN operations

### Query Optimization
- Price range queries
- Created_at sorting
- Category/location filtering

---

## Database Triggers

No custom triggers are currently implemented. All business logic is handled in the application layer.

---

## Data Migration

All schema migrations are stored in the Supabase migrations table and can be viewed using:

```sql
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
```

---

## Backup & Recovery

Supabase provides automatic daily backups. To manually create a backup:

1. Go to Supabase Dashboard
2. Navigate to Database → Backups
3. Create manual backup

---

## Extensions Used

1. **PostGIS** - Geographic data support
2. **pgcrypto** - Cryptographic functions
3. **uuid-ossp** - UUID generation

---

**Last Updated**: 2025-12-22
**Schema Version**: 1.0.0
**Total Tables**: 18
**Total Policies**: 50+
