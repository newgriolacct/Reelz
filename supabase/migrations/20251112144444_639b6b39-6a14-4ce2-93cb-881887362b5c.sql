-- Create transactions table to track all buy/sell actions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  token_id TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_name TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  amount NUMERIC NOT NULL,
  price_per_token NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view all transactions
CREATE POLICY "Users can view all transactions"
ON public.transactions
FOR SELECT
USING (true);

-- Anyone can create transactions
CREATE POLICY "Anyone can create transactions"
ON public.transactions
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_transactions_profile_id ON public.transactions(profile_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);