import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight } from 'lucide-react';

interface Props {
  discipline?: 'MMA' | 'BOXING';
  compact?: boolean;
  limit?: number;
}

interface Row {
  fighter_id: string;
  points: number;
  rank: number | null;
  wins: number;
  losses: number;
  draws: number;
  sparring_count: number;
  weight_class: string | null;
}

export default function SparcRanking({ discipline = 'MMA', compact = false, limit }: Props) {
  const take = limit ?? (compact ? 5 : 100);

  const { data, isLoading } = useQuery({
    queryKey: ['sparc-ranking', discipline, take],
    queryFn: async () => {
      const { data: rankings, error } = await supabase
        .from('sparc_rankings')
        .select('fighter_id, points, rank, wins, losses, draws, sparring_count, weight_class')
        .eq('discipline', discipline)
        .order('points', { ascending: false })
        .limit(take);
      if (error) throw error;
      const rows = (rankings ?? []) as Row[];
      if (rows.length === 0) return { rows, fighters: {} as Record<string, any> };

      const ids = rows.map((r) => r.fighter_id).filter(Boolean);
      const { data: fighters } = await supabase
        .from('fighter_profiles')
        .select('id, first_name, last_name, nickname, avatar_url, country')
        .in('id', ids);

      const map: Record<string, any> = {};
      (fighters ?? []).forEach((f: any) => { map[f.id] = f; });
      return { rows, fighters: map };
    },
    staleTime: 5 * 60 * 1000,
  });

  const rows = data?.rows ?? [];
  const fighters = data?.fighters ?? {};

  return (
    <div className="w-full">
      {isLoading && (
        <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--fid-text-muted)] py-4">
          Cargando…
        </div>
      )}
      {!isLoading && rows.length === 0 && (
        <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--fid-text-muted)] py-4">
          Sin entradas todavía.
        </div>
      )}
      <ol className="grid grid-cols-1 gap-1">
        {rows.map((r, i) => {
          const f = fighters[r.fighter_id];
          const name = f
            ? `${f.first_name ?? ''} ${f.last_name ?? ''}`.trim() || f.nickname || '—'
            : r.fighter_id.slice(0, 8);
          return (
            <li
              key={r.fighter_id}
              className="flex items-center justify-between gap-3 border border-[var(--fid-border)] bg-[#111111] px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-[11px] text-[var(--fid-text-muted)] w-6 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {f?.avatar_url ? (
                  <img
                    src={f.avatar_url}
                    alt=""
                    loading="lazy"
                    className="h-7 w-7 rounded-[2px] object-cover border border-[var(--fid-border)]"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-[2px] bg-[#1a1a1a] border border-[var(--fid-border)]" />
                )}
                <div className="min-w-0">
                  <div className="font-display text-sm text-white">{name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--fid-text-muted)]">
                    {r.wins}-{r.losses}-{r.draws} · {r.weight_class ?? '—'}
                  </div>
                </div>
              </div>
              <span className="font-mono text-xs text-[var(--fid-crimson)] shrink-0">
                {Number(r.points).toFixed(0)} pts
              </span>
            </li>
          );
        })}
      </ol>
      {compact && rows.length > 0 && (
        <Link
          to="/sparc/rankings"
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-[var(--fid-text-muted)] hover:text-white transition-colors"
        >
          Ver ranking completo <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
