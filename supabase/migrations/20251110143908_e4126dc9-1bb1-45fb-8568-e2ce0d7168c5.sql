-- Create token_favorites table to track user saves/likes
CREATE TABLE public.token_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_name TEXT NOT NULL,
  token_chain TEXT NOT NULL,
  token_image TEXT,
  token_price DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create token_comments table
CREATE TABLE public.token_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.token_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for token_favorites
CREATE POLICY "Users can view all favorites"
ON public.token_favorites
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own favorites"
ON public.token_favorites
FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'));

CREATE POLICY "Users can delete their own favorites"
ON public.token_favorites
FOR DELETE
USING (profile_id IN (SELECT id FROM public.profiles WHERE wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'));

-- RLS Policies for token_comments
CREATE POLICY "Users can view all comments"
ON public.token_comments
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own comments"
ON public.token_comments
FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'));

CREATE POLICY "Users can update their own comments"
ON public.token_comments
FOR UPDATE
USING (profile_id IN (SELECT id FROM public.profiles WHERE wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'));

CREATE POLICY "Users can delete their own comments"
ON public.token_comments
FOR DELETE
USING (profile_id IN (SELECT id FROM public.profiles WHERE wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'));

-- Create indexes for better performance
CREATE INDEX idx_token_favorites_profile_id ON public.token_favorites(profile_id);
CREATE INDEX idx_token_favorites_token_id ON public.token_favorites(token_id);
CREATE INDEX idx_token_comments_token_id ON public.token_comments(token_id);
CREATE INDEX idx_token_comments_profile_id ON public.token_comments(profile_id);

-- Add trigger for comments updated_at
CREATE TRIGGER update_token_comments_updated_at
BEFORE UPDATE ON public.token_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();