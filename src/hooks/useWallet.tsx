import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Wallet {
  id: string;
  currency: string;
  balance: number;
  hold: number;
}

interface WalletTransaction {
  id: string;
  kind: string;
  amount: number;
  created_at: string;
  meta: any;
  reference_id?: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Get user's app_user record
  const getUserAppId = useCallback(async () => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching app user:', error);
      return null;
    }
    
    return data?.id;
  }, [user]);

  // Fetch wallet data
  const fetchWallets = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const appUserId = await getUserAppId();
      if (!appUserId) return;

      const { data, error } = await supabase
        .from('wallet')
        .select('*')
        .eq('user_id', appUserId);

      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  }, [user, getUserAppId]);

  // Fetch transactions
  const fetchTransactions = useCallback(async (limit = 20) => {
    if (!user) return;

    try {
      const appUserId = await getUserAppId();
      if (!appUserId) return;

      const { data: walletsData } = await supabase
        .from('wallet')
        .select('id')
        .eq('user_id', appUserId);

      if (!walletsData?.length) return;

      const walletIds = walletsData.map(w => w.id);

      const { data, error } = await supabase
        .from('wallet_tx')
        .select('*')
        .in('wallet_id', walletIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [user, getUserAppId]);

  // Place bet using wallet system
  const placeBet = useCallback(async (
    marketId: string,
    outcomeId: string,
    stake: number
  ) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to place bets',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const appUserId = await getUserAppId();
      if (!appUserId) {
        throw new Error('User profile not found');
      }

      // Call the database function to process the bet
      const { data, error } = await supabase.rpc('process_bet_transaction', {
        p_user_id: appUserId,
        p_market_id: marketId,
        p_outcome_id: outcomeId,
        p_stake: stake
      });

      if (error) throw error;

      toast({
        title: 'Bet Placed!',
        description: `Your bet of $${stake} is being processed (5 second delay)`,
      });

      // Refresh wallet data
      fetchWallets();
      fetchTransactions();

      return data;
    } catch (error: any) {
      console.error('Error placing bet:', error);
      
      let errorMessage = 'Failed to place bet';
      if (error.message?.includes('Insufficient balance')) {
        errorMessage = 'Insufficient balance to place this bet';
      } else if (error.message?.includes('Wallet not found')) {
        errorMessage = 'Wallet not found. Please contact support.';
      }

      toast({
        title: 'Bet Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return null;
    }
  }, [user, getUserAppId, toast, fetchWallets, fetchTransactions]);

  // Get BDG wallet
  const getBDGWallet = useCallback(() => {
    return wallets.find(w => w.currency === 'BDG');
  }, [wallets]);

  // Calculate available balance (balance - hold)
  const getAvailableBalance = useCallback((currency = 'BDG') => {
    const wallet = wallets.find(w => w.currency === currency);
    if (!wallet) return 0;
    return Math.max(0, wallet.balance - wallet.hold);
  }, [wallets]);

  // Real-time wallet updates
  useEffect(() => {
    if (!user) return;

    fetchWallets();
    fetchTransactions();

    // Subscribe to wallet changes
    const channel = supabase
      .channel('wallet-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallet',
      }, (payload) => {
        console.log('Wallet update:', payload);
        fetchWallets();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'wallet_tx',
      }, (payload) => {
        console.log('Transaction update:', payload);
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchWallets, fetchTransactions]);

  return {
    wallets,
    transactions,
    loading,
    placeBet,
    getBDGWallet,
    getAvailableBalance,
    fetchWallets,
    fetchTransactions,
  };
};