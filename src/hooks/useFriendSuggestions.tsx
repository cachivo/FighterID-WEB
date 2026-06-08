import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FriendSuggestion {
  id: string;
  first_name: string | null;
  last_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  fighter_profile?: {
    gym_name: string | null;
    weight_class: string | null;
    country: string | null;
  } | null;
  common_friends_count?: number;
  reason: string; // Why this person is suggested
}

export const useFriendSuggestions = () => {
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSuggestions = async () => {
    try {
      if (!user) return;

      // Get current user's app_user
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!appUser) return;

      // Get current user's fighter profile (if any)
      const { data: myFighterProfile } = await supabase
        .from('fighter_profiles')
        .select('gym_name, weight_class, country')
        .eq('user_id', appUser.id)
        .maybeSingle();

      // Get existing friends and pending requests
      const { data: existingFriends } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', appUser.id);

      const { data: sentRequests } = await supabase
        .from('friend_requests')
        .select('receiver_id')
        .eq('sender_id', appUser.id)
        .eq('status', 'pending');

      const excludeIds = [
        appUser.id,
        ...(existingFriends?.map(f => f.friend_id) || []),
        ...(sentRequests?.map(r => r.receiver_id) || [])
      ];

      let suggestionsData: FriendSuggestion[] = [];

      if (myFighterProfile) {
        // Suggest fighters from same gym
        if (myFighterProfile.gym_name) {
          const { data: sameGymFighters } = await supabase
            .from('fighter_profiles')
            .select(`
              user_id,
              gym_name,
              weight_class,
              country
            `)
            .eq('gym_name', myFighterProfile.gym_name)
            .not('user_id', 'in', `(${excludeIds.join(',')})`);

          if (sameGymFighters) {
            const userIds = sameGymFighters.map(f => f.user_id).filter(Boolean);
            const { data: users } = await supabase
              .from('app_user')
              .select('id, first_name, last_name, handle, avatar_url')
              .in('id', userIds);

            users?.forEach(u => {
              const fighter = sameGymFighters.find(f => f.user_id === u.id);
              suggestionsData.push({
                ...u,
                fighter_profile: fighter ? {
                  gym_name: fighter.gym_name,
                  weight_class: fighter.weight_class,
                  country: fighter.country
                } : null,
                reason: `Entrena en ${myFighterProfile.gym_name}`
              });
            });
          }
        }

        // Suggest fighters from same weight class
        if (myFighterProfile.weight_class && suggestionsData.length < 10) {
          const { data: sameWeightFighters } = await supabase
            .from('fighter_profiles')
            .select(`
              user_id,
              gym_name,
              weight_class,
              country
            `)
            .eq('weight_class', myFighterProfile.weight_class)
            .not('user_id', 'in', `(${excludeIds.join(',')})`);

          if (sameWeightFighters) {
            const userIds = sameWeightFighters
              .map(f => f.user_id)
              .filter(id => !suggestionsData.some(s => s.id === id));
            
            const { data: users } = await supabase
              .from('app_user')
              .select('id, first_name, last_name, handle, avatar_url')
              .in('id', userIds);

            users?.forEach(u => {
              const fighter = sameWeightFighters.find(f => f.user_id === u.id);
              if (!suggestionsData.some(s => s.id === u.id)) {
                suggestionsData.push({
                  ...u,
                  fighter_profile: fighter ? {
                    gym_name: fighter.gym_name,
                    weight_class: fighter.weight_class,
                    country: fighter.country
                  } : null,
                  reason: `Misma categoría: ${myFighterProfile.weight_class}`
                });
              }
            });
          }
        }

        // Suggest fighters from same country
        if (myFighterProfile.country && suggestionsData.length < 10) {
          const { data: sameCountryFighters } = await supabase
            .from('fighter_profiles')
            .select(`
              user_id,
              gym_name,
              weight_class,
              country
            `)
            .eq('country', myFighterProfile.country)
            .not('user_id', 'in', `(${excludeIds.join(',')})`);

          if (sameCountryFighters) {
            const userIds = sameCountryFighters
              .map(f => f.user_id)
              .filter(id => !suggestionsData.some(s => s.id === id));
            
            const { data: users } = await supabase
              .from('app_user')
              .select('id, first_name, last_name, handle, avatar_url')
              .in('id', userIds);

            users?.forEach(u => {
              const fighter = sameCountryFighters.find(f => f.user_id === u.id);
              if (!suggestionsData.some(s => s.id === u.id)) {
                suggestionsData.push({
                  ...u,
                  fighter_profile: fighter ? {
                    gym_name: fighter.gym_name,
                    weight_class: fighter.weight_class,
                    country: fighter.country
                  } : null,
                  reason: `De ${myFighterProfile.country}`
                });
              }
            });
          }
        }
      }

      // If still not enough suggestions, get recent active users
      if (suggestionsData.length < 5) {
        const { data: recentUsers } = await supabase
          .from('app_user')
          .select('id, first_name, last_name, handle, avatar_url')
          .not('id', 'in', `(${excludeIds.join(',')})`)
          .order('created_at', { ascending: false })
          .limit(10);

        recentUsers?.forEach(u => {
          if (!suggestionsData.some(s => s.id === u.id)) {
            suggestionsData.push({
              ...u,
              reason: 'Usuario reciente'
            });
          }
        });
      }

      setSuggestions(suggestionsData.slice(0, 10));
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [user]);

  return {
    suggestions,
    loading,
    refreshSuggestions: fetchSuggestions
  };
};
