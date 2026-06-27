-- Hapus tabel jika sudah ada (hati-hati jika ada data)
DROP TABLE IF EXISTS store_settings CASCADE;
DROP TABLE IF EXISTS autotexts CASCADE;
DROP TABLE IF EXISTS presets CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS kasbons CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;

-- 1. Tabel Products
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own products" ON products FOR ALL USING (auth.uid() = user_id);

-- 2. Tabel Transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  items JSONB, -- Array of CartItem
  total NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'INCOME' | 'EXPENSE' | 'MUTASI' | 'MODAL_PAGI' | 'TAMBAH_SALDO' | 'PINDAH_SALDO'
  description TEXT,
  category TEXT,
  source_wallet TEXT,
  target_wallet TEXT,
  admin_fee NUMERIC,
  admin_non_tunai BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

-- 3. Tabel Wallets
CREATE TABLE wallets (
  id TEXT PRIMARY KEY, -- ex: 'Bank08', custom string ID
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  real_balance NUMERIC DEFAULT 0,
  icon TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (id, user_id)
);
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own wallets" ON wallets FOR ALL USING (auth.uid() = user_id);

-- 4. Tabel Contacts
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  bank_name TEXT,
  account_number TEXT,
  type TEXT NOT NULL, -- 'PELANGGAN' | 'AGEN' | 'SUPPLIER'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own contacts" ON contacts FOR ALL USING (auth.uid() = user_id);

-- 5. Tabel Kasbons
CREATE TABLE kasbons (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  remaining_amount NUMERIC NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL, -- 'BELUM_LUNAS' | 'LUNAS'
  wallet_id TEXT,
  payments JSONB DEFAULT '[]'::jsonb, -- Array of KasbonPayment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE kasbons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own kasbons" ON kasbons FOR ALL USING (auth.uid() = user_id);

-- 6. Tabel Notes
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tag TEXT, -- 'PENTING' | 'UMUM' | 'BELANJA' | 'OPERASIONAL' | 'PELANGGAN'
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own notes" ON notes FOR ALL USING (auth.uid() = user_id);

-- 7. Tabel Presets
CREATE TABLE presets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  nominal NUMERIC NOT NULL,
  harga_jual NUMERIC NOT NULL,
  admin_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own presets" ON presets FOR ALL USING (auth.uid() = user_id);

-- 8. Tabel AutoText
CREATE TABLE autotexts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  keterangan TEXT NOT NULL,
  harga_modal NUMERIC NOT NULL,
  harga_jual NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE autotexts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own autotexts" ON autotexts FOR ALL USING (auth.uid() = user_id);

-- 9. Tabel Licenses (Lisensi)
CREATE TABLE licenses (
  code TEXT PRIMARY KEY,
  assigned_email TEXT,
  used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by_email TEXT,
  used_at TIMESTAMP WITH TIME ZONE,
  referral_code_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Everyone can read licenses to check validity, but cannot modify easily unless specific policies
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read licenses" ON licenses FOR SELECT USING (true);
CREATE POLICY "Users can activate their own license" ON licenses FOR UPDATE USING (auth.uid() = used_by OR used_by IS NULL);

-- 10. Global Settings (Tabel Konfigurasi Global Aplikasi)
CREATE TABLE store_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT DEFAULT 'KASIR CUBA',
  store_logo TEXT,
  sub_store_name TEXT DEFAULT 'Aplikasi Kasir Toko',
  cashier_name TEXT DEFAULT 'Kasir Satu',
  store_address TEXT DEFAULT 'Jl. Contoh Alamat No. 123, Kota',
  announcement_text TEXT,
  promo_text TEXT,
  wisdom_text TEXT,
  rotating_words_text TEXT,
  ui_theme TEXT DEFAULT 'light',
  ui_layout TEXT DEFAULT 'hp',
  auto_reset_laci_kasir BOOLEAN DEFAULT FALSE,
  auto_reset_aset_digital BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own settings" ON store_settings FOR ALL USING (auth.uid() = user_id);
