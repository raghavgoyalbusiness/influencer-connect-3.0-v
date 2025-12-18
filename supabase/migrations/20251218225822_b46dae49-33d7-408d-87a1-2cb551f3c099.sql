-- Add delete policy for admin management
CREATE POLICY "Authenticated users can delete waitlist entries"
ON public.waitlist
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Add update policy for admin management  
CREATE POLICY "Authenticated users can update waitlist entries"
ON public.waitlist
FOR UPDATE
USING (auth.uid() IS NOT NULL);