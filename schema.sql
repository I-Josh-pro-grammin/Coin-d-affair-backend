-- Supabase-compatible schema import
-- Enable pgcrypto, postgis, uuid-ossp via dashboard first!

CREATE TYPE public.account_type AS ENUM (
    'admin',
    'business',
    'user'
);

CREATE TABLE public.addresses (
    address_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    label text,
    street text,
    city text,
    region text,
    country text,
    create_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    location geography(Point,4326)
);

CREATE TABLE public.admin_logs (
    log_id integer NOT NULL,
    admin_user_id uuid,
    action character varying(255) NOT NULL,
    resource_type character varying(255),
    resource_id character varying(255),
    meta jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.admin_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.admin_logs_log_id_seq OWNED BY public.admin_logs.log_id;

CREATE TABLE public.admin_notifications (
    notification_id integer NOT NULL,
    title character varying(255) NOT NULL,
    body text,
    target_user_id uuid,
    data jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.admin_notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.admin_notifications_notification_id_seq OWNED BY public.admin_notifications.notification_id;

CREATE TABLE public.businesses (
    business_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_name text NOT NULL,
    vat_number text,
    subscription_plan text DEFAULT 'free'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_paid boolean DEFAULT false,
    subscription_start timestamp with time zone,
    subscription_period_end timestamp with time zone,
    total_orders integer DEFAULT 0,
    rating numeric(3,2) DEFAULT 0.00
);

CREATE TABLE public.cart_items (
    cart_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    cart_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    sku_item_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    price_at_add numeric(14,2) NOT NULL,
    added_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.carts (
    cart_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    session_token text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.categories (
    category_id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_name text NOT NULL,
    slug text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name_fr text,
    icon text,
    description text
);

CREATE TABLE public.listing_media (
    listing_media_id uuid DEFAULT gen_random_uuid() NOT NULL,
    listing_id uuid NOT NULL,
    media_type text NOT NULL,
    url text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT listing_media_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text])))
);

CREATE TABLE public.listings (
    listings_id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid NOT NULL,
    business_id uuid,
    category_id uuid,
    subcategory_id uuid,
    title text NOT NULL,
    description text,
    price numeric(14,2) NOT NULL,
    currency text DEFAULT 'USD'::bpchar,
    condition text,
    is_negotiable boolean DEFAULT false,
    can_deliver boolean DEFAULT false,
    stock integer DEFAULT 0,
    attributes jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    location_id uuid
);

CREATE TABLE public.locations (
    location_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.order_items (
    order_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    sku_item_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(14,2) NOT NULL,
    total_price numeric(14,2) NOT NULL
);

CREATE TABLE public.orders (
    order_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    seller_id uuid,
    total_amount numeric(14,2) NOT NULL,
    currency character(3) DEFAULT 'USD'::bpchar,
    status text DEFAULT 'pending'::text NOT NULL,
    shipping_address_id uuid,
    billing_address_id uuid,
    is_guest boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.payments (
    payment_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    user_id uuid,
    provider text NOT NULL,
    provider_payment_id text,
    amount numeric(14,2) NOT NULL,
    currency character(3) DEFAULT 'USD'::bpchar,
    status text DEFAULT 'pending'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    recipient_type text,
    recipient_id uuid,
    CONSTRAINT payments_recipient_type_check CHECK ((recipient_type = ANY (ARRAY['admin'::text, 'business'::text]))),
    CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'succeeded'::text, 'failed'::text, 'refunded'::text])))
);

CREATE TABLE public.sku_items (
    sku_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    listing_id uuid NOT NULL,
    sku text,
    price numeric(14,2),
    stock integer DEFAULT 0,
    attributes jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.subcategories (
    subcategory_id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    subcategory_name text NOT NULL,
    slug text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name_fr text
);

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    phone text,
    password text NOT NULL,
    full_name text NOT NULL,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    account_type public.account_type DEFAULT 'user'::public.account_type,
    verifytoken text,
    is_active boolean DEFAULT true
);

CREATE TABLE public.variant_types (
    variant_id uuid DEFAULT gen_random_uuid() NOT NULL,
    listing_id uuid NOT NULL,
    variant_name text NOT NULL
);

CREATE TABLE public.variant_values (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    variant_type_id uuid NOT NULL,
    value text NOT NULL
);

-- Defaults for sequences
ALTER TABLE ONLY public.admin_logs ALTER COLUMN log_id SET DEFAULT nextval('public.admin_logs_log_id_seq'::regclass);
ALTER TABLE ONLY public.admin_notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.admin_notifications_notification_id_seq'::regclass);

-- Primary keys
ALTER TABLE ONLY public.addresses ADD CONSTRAINT addresses_pkey PRIMARY KEY (address_id);
ALTER TABLE ONLY public.admin_logs ADD CONSTRAINT admin_logs_pkey PRIMARY KEY (log_id);
ALTER TABLE ONLY public.admin_notifications ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (notification_id);
ALTER TABLE ONLY public.businesses ADD CONSTRAINT businesses_pkey PRIMARY KEY (business_id);
ALTER TABLE ONLY public.businesses ADD CONSTRAINT businesses_user_id_key UNIQUE (user_id);
ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_pkey PRIMARY KEY (cart_item_id);
ALTER TABLE ONLY public.carts ADD CONSTRAINT carts_pkey PRIMARY KEY (cart_id);
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_category_name_key UNIQUE (category_name);
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.listing_media ADD CONSTRAINT listing_media_pkey PRIMARY KEY (listing_media_id);
ALTER TABLE ONLY public.listings ADD CONSTRAINT listings_pkey PRIMARY KEY (listings_id);
ALTER TABLE ONLY public.locations ADD CONSTRAINT locations_pkey PRIMARY KEY (location_id);
ALTER TABLE ONLY public.locations ADD CONSTRAINT locations_name_key UNIQUE (name);
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);
ALTER TABLE ONLY public.sku_items ADD CONSTRAINT sku_items_pkey PRIMARY KEY (sku_item_id);
ALTER TABLE ONLY public.subcategories ADD CONSTRAINT subcategories_pkey PRIMARY KEY (subcategory_id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_phone_key UNIQUE (phone);
ALTER TABLE ONLY public.variant_types ADD CONSTRAINT variant_types_pkey PRIMARY KEY (variant_id);
ALTER TABLE ONLY public.variant_values ADD CONSTRAINT variant_values_pkey PRIMARY KEY (id);

-- Indexes
CREATE INDEX idx_addresses_location ON public.addresses USING gist (location);
CREATE INDEX idx_cart_items_cart ON public.cart_items USING btree (cart_id);
CREATE INDEX idx_carts_session ON public.carts USING btree (session_token);
CREATE INDEX idx_carts_user ON public.carts USING btree (user_id);
CREATE INDEX idx_listing_media_listing ON public.listing_media USING btree (listing_id);
CREATE INDEX idx_listings_price ON public.listings USING btree (price);
CREATE INDEX idx_listings_seller ON public.listings USING btree (seller_id);
CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);
CREATE INDEX idx_orders_status ON public.orders USING btree (status);
CREATE INDEX idx_orders_user ON public.orders USING btree (user_id);
CREATE INDEX idx_payments_order ON public.payments USING btree (order_id);
CREATE INDEX idx_payments_provider_id ON public.payments USING btree (provider_payment_id);
CREATE INDEX idx_payments_status ON public.payments USING btree (status);
CREATE INDEX idx_sku_code ON public.sku_items USING btree (sku);
CREATE INDEX idx_sku_listing ON public.sku_items USING btree (listing_id);
CREATE INDEX idx_variant_types_listing ON public.variant_types USING btree (listing_id);
CREATE INDEX idx_variant_values_type ON public.variant_values USING btree (variant_type_id);

-- Foreign keys
ALTER TABLE ONLY public.addresses ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.admin_logs ADD CONSTRAINT admin_logs_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.admin_notifications ADD CONSTRAINT admin_notifications_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.businesses ADD CONSTRAINT businesses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(cart_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(listings_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_sku_item_id_fkey FOREIGN KEY (sku_item_id) REFERENCES public.sku_items(sku_item_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.carts ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.listing_media ADD CONSTRAINT listing_media_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(listings_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.listings ADD CONSTRAINT listings_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(business_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.listings ADD CONSTRAINT listings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.listings ADD CONSTRAINT listings_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(location_id);
ALTER TABLE ONLY public.listings ADD CONSTRAINT listings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.listings ADD CONSTRAINT listings_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(subcategory_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(listings_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_sku_item_id_fkey FOREIGN KEY (sku_item_id) REFERENCES public.sku_items(sku_item_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_billing_address_id_fkey FOREIGN KEY (billing_address_id) REFERENCES public.addresses(address_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(user_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_shipping_address_id_fkey FOREIGN KEY (shipping_address_id) REFERENCES public.addresses(address_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.sku_items ADD CONSTRAINT sku_items_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(listings_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.subcategories ADD CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.variant_types ADD CONSTRAINT variant_types_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(listings_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.variant_values ADD CONSTRAINT variant_values_variant_type_id_fkey FOREIGN KEY (variant_type_id) REFERENCES public.variant_types(variant_id) ON DELETE CASCADE;