-- Allow admin to delete submissions
CREATE POLICY "Admin can delete all submissions"
ON public.intake_submissions
FOR DELETE
USING (auth.email() = 'lachlanjc@gmail.com');
