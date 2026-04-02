-- Add status tracking to submissions
ALTER TABLE public.intake_submissions
ADD COLUMN status TEXT NOT NULL DEFAULT 'new'
CHECK (status IN ('new', 'in_progress', 'delivered', 'revision'));

-- Allow admin to view all submissions
CREATE POLICY "Admin can view all submissions"
ON public.intake_submissions
FOR SELECT
USING (auth.email() = 'lachlanjc@gmail.com');

-- Allow admin to update any submission (e.g. status changes)
CREATE POLICY "Admin can update all submissions"
ON public.intake_submissions
FOR UPDATE
USING (auth.email() = 'lachlanjc@gmail.com');
