-- Create token_likes table
CREATE TABLE public.token_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, token_id)
);

-- Enable RLS
ALTER TABLE public.token_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all likes"
ON public.token_likes
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create likes"
ON public.token_likes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete likes"
ON public.token_likes
FOR DELETE
USING (true);

-- Create index for performance
CREATE INDEX idx_token_likes_profile_id ON public.token_likes(profile_id);
CREATE INDEX idx_token_likes_token_id ON public.token_likes(token_id);