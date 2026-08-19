-- ============================================================
-- GADGET HUB - Supabase schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- Products
create table if not exists public.products (
  id text primary key,
  slug text not null,
  title text not null,
  category text not null,
  brand text not null default '',
  price double precision not null default 0,
  "oldPrice" double precision,
  stock integer not null default 0,
  rating double precision not null default 0,
  reviews integer not null default 0,
  image text not null default '',
  gallery jsonb not null default '[]',
  "shortDescription" text not null default '',
  description text not null default '',
  specs jsonb not null default '[]',
  badge text,
  featured boolean not null default false,
  "group" text,
  tags jsonb not null default '[]',
  "miniStore" boolean not null default false,
  "supplyType" text,
  "createdAt" text,
  "updatedAt" text
);
create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_category_idx on public.products (category);

-- Users
create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null unique,
  "passwordHash" text,
  role text not null default 'customer',
  grade text,
  school text,
  "createdAt" text not null
);
create index if not exists users_email_idx on public.users (email);

-- Sessions
create table if not exists public.sessions (
  token text primary key,
  "userId" text not null references public.users (id) on delete cascade,
  expires bigint not null
);
create index if not exists sessions_user_idx on public.sessions ("userId");

-- Orders
create table if not exists public.orders (
  id text primary key,
  "orderNumber" text not null,
  total double precision not null default 0,
  status text not null default 'pending',
  channel text not null default 'online',
  customer jsonb not null default '{}',
  source text,
  "couponCode" text,
  discount double precision,
  "createdAt" text not null,
  "updatedAt" text not null,
  synced boolean not null default true
);
create index if not exists orders_created_idx on public.orders ("createdAt");
create index if not exists orders_status_idx on public.orders (status);

-- Order items
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  "orderId" text not null references public.orders (id) on delete cascade,
  "productId" text not null,
  title text not null,
  price double precision not null,
  qty integer not null
);
create index if not exists order_items_order_idx on public.order_items ("orderId");

-- Reviews
create table if not exists public.reviews (
  id text primary key,
  "productId" text not null,
  "userId" text,
  author text not null,
  rating integer not null,
  title text,
  comment text not null,
  verified boolean not null default false,
  "createdAt" text not null
);
create index if not exists reviews_product_idx on public.reviews ("productId");

-- Coupons
create table if not exists public.coupons (
  id text primary key,
  code text not null unique,
  type text not null,
  value double precision not null,
  "minSubtotal" double precision not null default 0,
  "maxDiscount" double precision,
  active boolean not null default true,
  "maxUses" integer,
  used integer not null default 0,
  "expiresAt" text,
  description text
);

-- Wishlists (one row per user+product)
create table if not exists public.wishlists (
  "userId" text not null references public.users (id) on delete cascade,
  "productId" text not null,
  primary key ("userId", "productId")
);

-- Deleted product ids (prevents re-seeding)
create table if not exists public.deleted_products (
  id text primary key,
  "deletedAt" text not null
);

-- App settings (jsonb payload per key, e.g. "notifications")
create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}',
  "updatedAt" text
);

-- Rate limiting (distributed, persistent counters for Vercel/serverless)
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at bigint not null,
  "updatedAt" text not null default (now())::text
);
create index if not exists rate_limits_reset_idx on public.rate_limits (reset_at);

-- Atomically bumps a rate-limit counter, resetting expired windows, and reports
-- whether the request is allowed. Called by the app via `sb.rpc("bump_rate_limit")`.
create or replace function public.bump_rate_limit(p_key text, p_window_ms bigint, p_limit integer)
returns table(ok boolean, retry_after bigint) language plpgsql as $$
declare
  v_count integer;
  v_reset bigint;
  v_now bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  insert into public.rate_limits (key, count, reset_at, "updatedAt")
  values (p_key, 1, v_now + p_window_ms, (now())::text)
  on conflict (key) do update
    set count = case when public.rate_limits.reset_at < v_now then 1 else public.rate_limits.count + 1 end,
        reset_at = case when public.rate_limits.reset_at < v_now then v_now + p_window_ms else public.rate_limits.reset_at end,
        "updatedAt" = (now())::text
  returning count, reset_at into v_count, v_reset;

  if v_count > p_limit then
    return query select false, v_reset - v_now;
  else
    return query select true, 0::bigint;
  end if;
end; $$;

-- Shop-by-category cards (admin-editable home page carousel)
create table if not exists public.category_cards (
  id text primary key,
  name text not null,
  tagline text not null default '',
  href text not null default '',
  image text not null default '',
  icon text not null default '',
  "sortOrder" integer not null default 0,
  active boolean not null default true,
  "updatedAt" text
);
create index if not exists category_cards_sort_idx on public.category_cards ("sortOrder");

-- Catalogue items (admin-editable stock items shown on shop category pages)
create table if not exists public.catalog_items (
  id text primary key,
  name text not null,
  tag text not null default '',
  category text not null default '',
  image text not null default '',
  price double precision,
  "sortOrder" integer not null default 0,
  active boolean not null default true,
  "updatedAt" text
);
create index if not exists catalog_items_sort_idx on public.catalog_items ("sortOrder");

-- AI bulk product image matching (see IMAGE IMPORTATION.txt)
-- Import jobs (a batch of uploaded images awaiting AI processing)
create table if not exists public.image_import_jobs (
  id text primary key,
  "adminId" text not null,
  "totalImages" integer not null default 0,
  "processedImages" integer not null default 0,
  "matchedImages" integer not null default 0,
  "reviewImages" integer not null default 0,
  "unmatchedImages" integer not null default 0,
  "failedImages" integer not null default 0,
  status text not null default 'pending',
  "autoMatchThreshold" integer not null default 85,
  "reviewThreshold" integer not null default 60,
  "createdAt" text not null,
  "completedAt" text
);
create index if not exists image_import_jobs_created_idx on public.image_import_jobs ("createdAt");

-- Individual images within an import job
create table if not exists public.image_import_items (
  id text primary key,
  "jobId" text not null references public.image_import_jobs (id) on delete cascade,
  "originalFilename" text not null,
  "storagePath" text not null default '',
  "fileHash" text not null default '',
  mime text not null default '',
  size integer not null default 0,
  status text not null default 'uploaded',
  "aiAnalysis" jsonb,
  "candidateProductId" text,
  "confidenceScore" double precision,
  "altText" text,
  "errorMessage" text,
  "createdAt" text not null,
  "updatedAt" text not null
);
create index if not exists image_import_items_job_idx on public.image_import_items ("jobId");
create index if not exists image_import_items_hash_idx on public.image_import_items ("fileHash");

-- ============================================================
-- Privileges: the app talks to Supabase ONLY server-side via the
-- service_role key (see src/lib/server/supabase.ts). Grant full
-- access to service_role so PostgREST can read/write the tables.
-- (idempotent - safe to re-run alongside the CREATEs above)
-- ============================================================
grant usage on schema public to service_role;
grant all on table public.products to service_role;
grant all on table public.users to service_role;
grant all on table public.sessions to service_role;
grant all on table public.orders to service_role;
grant all on table public.order_items to service_role;
grant all on table public.reviews to service_role;
grant all on table public.coupons to service_role;
grant all on table public.wishlists to service_role;
grant all on table public.deleted_products to service_role;
grant all on table public.settings to service_role;
grant all on table public.rate_limits to service_role;
grant execute on function public.bump_rate_limit(text, bigint, integer) to service_role;
grant all on table public.category_cards to service_role;
grant all on table public.catalog_items to service_role;
grant all on table public.image_import_jobs to service_role;
grant all on table public.image_import_items to service_role;
grant usage, select on sequence public.order_items_id_seq to service_role;
