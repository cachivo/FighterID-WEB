import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

export interface Friend {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!appUser) return;

      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          friend_id,
          friend:app_user!friendships_friend_id_fkey(id, first_name, last_name, avatar_url, bio, email)
        `)
        .eq('user_id', appUser.id);

      if (error) throw error;

      const friendsData = friendships?.map(f => f.friend).filter(Boolean) as Friend[];
      setFriends(friendsData || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!appUser) return;

      // Received requests
      const { data: received } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender:app_user!friend_requests_sender_id_fkey(id, first_name, last_name, avatar_url, email)
        `)
        .eq('receiver_id', appUser.id)
        .eq('status', 'pending');

      setFriendRequests((received || []) as FriendRequest[]);

      // Sent requests
      const { data: sent } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', appUser.id)
        .eq('status', 'pending');

      setSentRequests((sent || []) as FriendRequest[]);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes iniciar sesión');
        return false;
      }

      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!appUser) {
        toast.error('Usuario no encontrado');
        return false;
      }

      if (appUser.id === receiverId) {
        toast.error('No puedes enviarte una solicitud a ti mismo');
        return false;
      }

      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: appUser.id,
          receiver_id: receiverId
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Ya enviaste una solicitud a este usuario');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Solicitud enviada');
      fetchFriendRequests();
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Error al enviar solicitud');
      return false;
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Solicitud aceptada');
      fetchFriendRequests();
      fetchFriends();
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Error al aceptar solicitud');
      return false;
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Solicitud rechazada');
      fetchFriendRequests();
      return true;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error('Error al rechazar solicitud');
      return false;
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!appUser) return false;

      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${appUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${appUser.id})`);

      if (error) throw error;

      toast.success('Amigo eliminado');
      fetchFriends();
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Error al eliminar amigo');
      return false;
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  return {
    friends,
    friendRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    refreshFriends: fetchFriends,
    refreshRequests: fetchFriendRequests
  };
};
