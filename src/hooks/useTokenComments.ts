import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';

interface TokenComment {
  id: string;
  profile_id: string;
  token_id: string;
  comment: string;
  created_at: string;
  wallet_address?: string;
}

export const useTokenComments = (tokenId: string) => {
  const { publicKey, connected } = useWallet();
  const [comments, setComments] = useState<TokenComment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('token_comments')
        .select(`
          *,
          profiles!inner(wallet_address)
        `)
        .eq('token_id', tokenId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const commentsWithWallet = data?.map(comment => ({
        ...comment,
        wallet_address: (comment.profiles as any)?.wallet_address,
      })) || [];

      setComments(commentsWithWallet);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (commentText: string) => {
    if (!connected || !publicKey) {
      toast({
        title: "Connect wallet",
        description: "Please connect your wallet to comment",
        variant: "destructive",
      });
      return false;
    }

    if (!commentText.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment",
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

      const { error } = await supabase
        .from('token_comments')
        .insert([{
          profile_id: profile.id,
          token_id: tokenId,
          comment: commentText,
        }]);

      if (error) throw error;

      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!connected || !publicKey) return false;

    try {
      const walletAddress = publicKey.toString();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (!profile) return false;

      const { error } = await supabase
        .from('token_comments')
        .delete()
        .eq('id', commentId)
        .eq('profile_id', profile.id);

      if (error) throw error;

      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  };

  useEffect(() => {
    if (tokenId) {
      fetchComments();
    }
  }, [tokenId]);

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    refetch: fetchComments,
  };
};
