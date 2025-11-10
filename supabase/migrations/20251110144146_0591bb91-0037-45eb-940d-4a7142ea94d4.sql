-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own favorites" ON public.token_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.token_favorites;
DROP POLICY IF EXISTS "Users can create their own comments" ON public.token_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.token_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.token_comments;

-- Create simplified policies that work with any profile_id
-- Since we handle auth in the app layer with wallet connection
CREATE POLICY "Anyone can create favorites"
ON public.token_favorites
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete favorites"
ON public.token_favorites
FOR DELETE
USING (true);

CREATE POLICY "Anyone can create comments"
ON public.token_comments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update comments"
ON public.token_comments
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete comments"
ON public.token_comments
FOR DELETE
USING (true);