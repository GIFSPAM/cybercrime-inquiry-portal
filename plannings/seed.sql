-- DB Schema Initialization for Supabase/PostgreSQL Database

-- ==========================================
-- 1. CREATE TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    taluk VARCHAR(100) NOT NULL,
    UNIQUE (name, taluk)
);

CREATE TABLE IF NOT EXISTS inquiries (
    id BIGSERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    location_id INTEGER NOT NULL REFERENCES locations(id),
    description TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    complainant_name VARCHAR(255),
    complainant_phone VARCHAR(20),
    feedback TEXT,
    reference_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. INDEX OPTIMIZATION
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_inquiries_category ON inquiries(category_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_location ON inquiries(location_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_reference_id ON inquiries(reference_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);

-- ==========================================
-- 3. REFERENCE ID TRIGGER FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION generate_inquiry_reference_id()
RETURNS TRIGGER AS $$
DECLARE
    today_date VARCHAR(10);
    today_count INTEGER;
    local_today DATE;
    random_salt VARCHAR(4);
BEGIN
    -- Get today's date in local Kerala time (Asia/Kolkata timezone)
    local_today := (timezone('Asia/Kolkata', now()))::date;
    today_date := to_char(local_today, 'YYYYMMDD');
    
    -- Count inquiries created on this local date using index range search (sargable)
    SELECT COUNT(*) INTO today_count
    FROM inquiries
    WHERE created_at >= (local_today::text || ' 00:00:00 Asia/Kolkata')::timestamptz
      AND created_at < ((local_today + 1)::text || ' 00:00:00 Asia/Kolkata')::timestamptz;
    
    -- Generate random 4-character uppercase alphanumeric salt
    random_salt := upper(substring(md5(random()::text) from 1 for 4));
    
    -- Format: INQ-YYYYMMDD-Sequence-Salt (e.g., INQ-20260624-001-A8F2)
    NEW.reference_id := 'INQ-' || today_date || '-' || lpad((today_count + 1)::text, 3, '0') || '-' || random_salt;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind trigger to table
DROP TRIGGER IF EXISTS trg_set_inquiry_reference_id ON inquiries;
CREATE TRIGGER trg_set_inquiry_reference_id
BEFORE INSERT ON inquiries
FOR EACH ROW
EXECUTE FUNCTION generate_inquiry_reference_id();

-- ==========================================
-- 4. ROW-LEVEL SECURITY (RLS) & POLICIES
-- ==========================================

-- Enable Row-Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Allow public read access to categories" 
ON categories FOR SELECT USING (true);

-- Locations policies
CREATE POLICY "Allow public read access to locations" 
ON locations FOR SELECT USING (true);

-- Inquiries policies
CREATE POLICY "Allow public insertion of new inquiries" 
ON inquiries FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public selection of inquiries by reference ID" 
ON inquiries FOR SELECT USING (true);

CREATE POLICY "Allow public update of rating and feedback" 
ON inquiries FOR UPDATE USING (true) WITH CHECK (true);
