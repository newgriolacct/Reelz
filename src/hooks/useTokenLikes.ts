import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';

export const useTokenLikes = (tokenId: string) => {
  const { publicKey, connected } = useWallet();
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLikes = async () => {
    try {
      // Get total likes for token
      const { count, error } = await supabase
        .from('token_likes')
        .select('*', { count: 'exact', head: true })
        .eq('token_id', tokenId);

      if (error) throw error;
      setLikeCount(count || 0);

      // Check if current user liked it
      if (connected && publicKey) {
        const walletAddress = publicKey.toString();
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', walletAddress)
          .maybeSingle();

        if (profile) {
          const { data: userLike } = await supabase
            .from('token_likes')
            .select('id')
            .eq('profile_id', profile.id)
            .eq('token_id', tokenId)
            .maybeSingle();

          setIsLiked(!!userLike);
        }
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const toggleLike = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Connect wallet",
        description: "Please connect your wallet to like tokens",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      const walletAddress = publicKey.toString();
      
      // Get or create profile
      let { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (!profile) {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([{ wallet_address: walletAddress }])
          .select()
          .maybeSingle();
        
        if (profileError) throw profileError;
        profile = newProfile;
      }

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('token_likes')
          .delete()
          .eq('profile_id', profile.id)
          .eq('token_id', tokenId);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('token_likes')
          .insert([{
            profile_id: profile.id,
            token_id: tokenId,
          }]);

        if (error) throw error;
      }

      await fetchLikes();
      return true;
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenId) {
      fetchLikes();
    }
  }, [tokenId, connected, publicKey]);

  return {
    likeCount,
    isLiked,
    toggleLike,
    loading,
  };
};
