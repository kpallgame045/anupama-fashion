-- =========================================================
-- ANUPAMA FASHION - SUPABASE DATABASE SCHEMA
-- Table: reviews (ONLY SINGLE TABLE PER SPECIFICATION)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_text TEXT NOT NULL,
    language TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_language ON public.reviews(language);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to verify historical review uniqueness
CREATE POLICY "Allow public read access for similarity check" 
ON public.reviews FOR SELECT 
USING (true);

-- Allow inserting accepted unique review drafts
CREATE POLICY "Allow public insert for accepted drafts" 
ON public.reviews FOR INSERT 
WITH CHECK (true);
