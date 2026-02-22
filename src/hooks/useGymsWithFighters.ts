import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GymWithFighters {
  id: string;
  nombre: string;
  slug: string;
  ciudad: string | null;
  logo_url: string | null;
  disciplinas: string[];
  fighter_count: number;
  fighters: {
    id: string;
    first_name: string;
    last_name: string;
    nickname: string | null;
    avatar_url: string | null;
  }[];
}

export const useGymsWithFighters = () => {
  return useQuery({
    queryKey: ["gyms-with-fighters"],
    queryFn: async () => {
      // Get gyms with fighter count
      const { data: gyms, error: gymsError } = await supabase
        .from("gyms")
        .select("id, nombre, slug, ciudad, logo_url, disciplinas")
        .eq("activo", true);

      if (gymsError) throw gymsError;

      // Get fighters grouped by gym
      const { data: fighters, error: fightersError } = await supabase
        .from("fighter_profiles")
        .select("id, first_name, last_name, nickname, avatar_url, gym_id")
        .not("gym_id", "is", null);

      if (fightersError) throw fightersError;

      // Group fighters by gym
      const fightersByGym = new Map<string, typeof fighters>();
      for (const f of fighters) {
        if (!f.gym_id) continue;
        const arr = fightersByGym.get(f.gym_id) || [];
        arr.push(f);
        fightersByGym.set(f.gym_id, arr);
      }

      // Merge and filter gyms with at least 1 fighter
      const result: GymWithFighters[] = (gyms || [])
        .map(g => ({
          ...g,
          disciplinas: g.disciplinas || [],
          fighter_count: fightersByGym.get(g.id)?.length || 0,
          fighters: (fightersByGym.get(g.id) || []).slice(0, 5).map(f => ({
            id: f.id,
            first_name: f.first_name,
            last_name: f.last_name,
            nickname: f.nickname,
            avatar_url: f.avatar_url,
          })),
        }))
        .filter(g => g.fighter_count > 0)
        .sort((a, b) => b.fighter_count - a.fighter_count);

      return result;
    },
    staleTime: 10 * 60 * 1000,
  });
};
