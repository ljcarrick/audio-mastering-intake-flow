-- Create intake_submissions table to persist form submissions
CREATE TABLE public.intake_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist TEXT NOT NULL,
  project_title TEXT,
  project_type TEXT NOT NULL,
  num_tracks INTEGER NOT NULL,
  tracks JSONB NOT NULL DEFAULT '[]',
  mix_files JSONB NOT NULL DEFAULT '[]',
  has_isrcs BOOLEAN NOT NULL DEFAULT false,
  deadline DATE,
  is_rush BOOLEAN NOT NULL DEFAULT false,
  contacts JSONB NOT NULL DEFAULT '[]',
  billing_info JSONB NOT NULL DEFAULT '{}',
  master_formats TEXT[] NOT NULL DEFAULT '{}',
  extra_passes TEXT[] NOT NULL DEFAULT '{}',
  project_notes TEXT,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.intake_submissions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own submissions
CREATE POLICY "Users can insert own submissions"
ON public.intake_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
ON public.intake_submissions
FOR SELECT
USING (auth.uid() = user_id);
