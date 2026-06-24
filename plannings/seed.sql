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
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    money_lost NUMERIC(12, 2) DEFAULT NULL,
    CONSTRAINT chk_description_length CHECK (char_length(description) <= 1500),
    CONSTRAINT chk_feedback_length CHECK (feedback IS NULL OR char_length(feedback) <= 1000),
    CONSTRAINT chk_money_lost_positive CHECK (money_lost IS NULL OR money_lost >= 0)
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
-- Public can ONLY insert. RLS enforces that rating and feedback are NULL on initial creation.
CREATE POLICY "Allow public insertion of new inquiries" 
ON inquiries FOR INSERT WITH CHECK (
    rating IS NULL AND feedback IS NULL
);

-- ==========================================
-- 5. SECURE DATABASE FUNCTIONS (RPCs)
-- ==========================================

-- Secure lookup of case details by reference ID
DROP FUNCTION IF EXISTS get_inquiry_by_reference(text);
CREATE OR REPLACE FUNCTION get_inquiry_by_reference(p_reference_id TEXT)
RETURNS TABLE (
    category_id INTEGER,
    location_id INTEGER,
    description TEXT,
    rating INTEGER,
    complainant_name VARCHAR(255),
    complainant_phone VARCHAR(20),
    feedback TEXT,
    reference_id VARCHAR(50),
    created_at TIMESTAMPTZ,
    category_name VARCHAR(255),
    location_name VARCHAR(255),
    money_lost NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.category_id,
        i.location_id,
        i.description,
        i.rating,
        i.complainant_name,
        i.complainant_phone,
        i.feedback,
        i.reference_id,
        i.created_at,
        c.name::VARCHAR(255) AS category_name,
        l.name::VARCHAR(255) AS location_name,
        i.money_lost
    FROM inquiries i
    JOIN categories c ON i.category_id = c.id
    JOIN locations l ON i.location_id = l.id
    WHERE i.reference_id = p_reference_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure feedback submission with double rating check and boundary verification
CREATE OR REPLACE FUNCTION submit_inquiry_feedback(
    p_reference_id TEXT,
    p_rating INTEGER,
    p_feedback TEXT
)
RETURNS VOID AS $$
DECLARE
    v_existing_rating INTEGER;
BEGIN
    -- Validate rating boundary
    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5.';
    END IF;

    -- Validate feedback character length boundary
    IF p_feedback IS NOT NULL AND char_length(p_feedback) > 1000 THEN
        RAISE EXCEPTION 'Feedback must be 1000 characters or less.';
    END IF;

    -- Lock the row and check for existing feedback to prevent duplicate rating submissions
    SELECT rating INTO v_existing_rating
    FROM inquiries
    WHERE reference_id = p_reference_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inquiry with reference ID % not found.', p_reference_id;
    END IF;

    IF v_existing_rating IS NOT NULL AND v_existing_rating > 0 THEN
        RAISE EXCEPTION 'Feedback has already been logged for this inquiry.';
    END IF;

    -- Perform secure update
    UPDATE inquiries
    SET rating = p_rating,
        feedback = p_feedback
    WHERE reference_id = p_reference_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure creation of a new inquiry (returns generated reference ID)
DROP FUNCTION IF EXISTS create_inquiry(integer, integer, text, varchar, varchar);
DROP FUNCTION IF EXISTS create_inquiry(integer, integer, text, varchar, varchar, numeric);
CREATE OR REPLACE FUNCTION create_inquiry(
    p_category_id INTEGER,
    p_location_id INTEGER,
    p_description TEXT,
    p_complainant_name VARCHAR(255),
    p_complainant_phone VARCHAR(20),
    p_money_lost NUMERIC DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_phone TEXT;
    v_reference_id VARCHAR(50);
BEGIN
    -- Validate description length boundary
    IF char_length(p_description) < 15 OR char_length(p_description) > 1500 THEN
        RAISE EXCEPTION 'Description must be between 15 and 1500 characters.';
    END IF;

    -- Validate phone number formatting (optional complainant phone)
    IF p_complainant_phone IS NOT NULL AND p_complainant_phone <> '' THEN
        -- Strip spaces and hyphens
        v_phone := regexp_replace(p_complainant_phone, '[\s-]', '', 'g');
        IF NOT v_phone ~ '^(?:\+91|0)?[6-9]\d{9}$' THEN
            RAISE EXCEPTION 'Please enter a valid 10-digit phone number (optionally prefixed with +91 or 0).';
        END IF;
    END IF;

    -- Validate money lost is non-negative
    IF p_money_lost IS NOT NULL AND p_money_lost < 0 THEN
        RAISE EXCEPTION 'Financial loss cannot be negative.';
    END IF;

    -- Insert record (trigger generates reference_id)
    INSERT INTO inquiries (
        category_id,
        location_id,
        description,
        complainant_name,
        complainant_phone,
        money_lost
    )
    VALUES (
        p_category_id,
        p_location_id,
        p_description,
        NULLIF(p_complainant_name, ''),
        NULLIF(p_complainant_phone, ''),
        NULLIF(p_money_lost, 0)
    )
    RETURNING reference_id INTO v_reference_id;

    RETURN v_reference_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. ROLES PRIVILEGES (GRANT ACCESS)
-- ==========================================

-- Grant schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table privileges
GRANT SELECT ON TABLE public.categories TO anon, authenticated;
GRANT SELECT ON TABLE public.locations TO anon, authenticated;

-- Inquiries table privileges
-- Grant full privileges to authenticated users (admin/dashboard role)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inquiries TO authenticated;

-- Revoke direct SELECT, INSERT & UPDATE privileges on the inquiries table from anon role entirely
REVOKE SELECT, INSERT, UPDATE ON TABLE public.inquiries FROM anon;

-- Grant sequence privileges (to allow SERIAL auto-increment ID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant execution rights to the secure database RPCs
GRANT EXECUTE ON FUNCTION public.create_inquiry(INTEGER, INTEGER, TEXT, VARCHAR, VARCHAR, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_inquiry_by_reference(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_inquiry_feedback(TEXT, INTEGER, TEXT) TO anon, authenticated;

