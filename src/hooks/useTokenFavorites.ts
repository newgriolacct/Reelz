import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';

interface FavoriteToken {
  id: string;
  token_id: string;
  token_symbol: string;
  token_name: string;
  token_chain: string;
  token_image: string | null;
  token_price: number | null;
  created_at: string;
}

export const useTokenFavorites = () => {
  const { publicKey, connected } = useWallet();
  const [favorites, setFavorites] = useState<FavoriteToken[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchFavorites = async () => {
    if (!connected || !publicKey) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    try {
      const walletAddress = publicKey.toString();
      
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress)
        .single();

      if (!profile) {
        setFavorites([]);
        return;
      }

      // Get favorites
      const { data, error } = await supabase
        .from('token_favorites')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (token: {
    id: string;
    symbol: string;
    name: string;
    chain: string;
    avatarUrl: string;
    price: number;
  }) => {
    if (!connected || !publicKey) {
      toast({
        title: "Connect wallet",
        description: "Please connect your wallet to save favorites",
        variant: "destructive",
      });
      return false;
    }

    try {
      const walletAddress = publicKey.toString();
      
      // Get or create profile
      let { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress)
        .single();

      if (!profile) {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([{ wallet_address: walletAddress }])
          .select()
          .single();
        
        if (profileError) throw profileError;
        profile = newProfile;
      }

      // Add favorite
      const { error } = await supabase
        .from('token_favorites')
        .insert([{
          profile_id: profile.id,
          token_id: token.id,
          token_symbol: token.symbol,
          token_name: token.name,
          token_chain: token.chain,
          token_image: token.avatarUrl,
          token_price: token.price,
        }]);

      if (error) throw error;

      await fetchFavorites();
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast({
        title: "Error",
        description: "Failed to add favorite",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeFavorite = async (tokenId: string) => {
    if (!connected || !publicKey) return false;

    try {
      const walletAddress = publicKey.toString();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress)
        .single();

      if (!profile) return false;

      const { error } = await supabase
        .from('token_favorites')
        .delete()
        .eq('profile_id', profile.id)
        .eq('token_id', tokenId);

      if (error) throw error;

      await fetchFavorites();
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  };

  const isFavorited = (tokenId: string) => {
    return favorites.some(f => f.token_id === tokenId);
  };

  useEffect(() => {
    fetchFavorites();
  }, [connected, publicKey]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorited,
    refetch: fetchFavorites,
  };
};
