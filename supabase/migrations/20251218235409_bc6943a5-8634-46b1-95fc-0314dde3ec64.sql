-- Remove the insecure public read policy
DROP POLICY IF EXISTS "Anyone can read waitlist entries" ON public.waitlist;

-- Create a secure policy that only allows admins to read waitlist data
CREATE POLICY "Admins can view waitlist entries" 
ON public.waitlist 
FOR SELECT 
USING (public.has_role(auth.uid(), 'agency'));

-- Also secure the update and delete policies to admin only
DROP POLICY IF EXISTS "Authenticated users can update waitlist entries" ON public.waitlist;
DROP POLICY IF EXISTS "Authenticated users can delete waitlist entries" ON public.waitlist;

CREATE POLICY "Admins can update waitlist entries" 
ON public.waitlist 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'agency'));

CREATE POLICY "Admins can delete waitlist entries" 
ON public.waitlist 
FOR DELETE 
USING (public.has_role(auth.uid(), 'agency'));