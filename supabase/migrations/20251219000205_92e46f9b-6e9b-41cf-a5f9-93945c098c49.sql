-- Fix: AI logs table should only allow server-side inserts (via service role key)
-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "System can insert logs" ON public.ai_logs;

-- Create a restrictive policy that blocks all client-side inserts
-- Server-side inserts using service_role key bypass RLS entirely
CREATE POLICY "Only system can insert logs" 
ON public.ai_logs 
FOR INSERT 
WITH CHECK (false);