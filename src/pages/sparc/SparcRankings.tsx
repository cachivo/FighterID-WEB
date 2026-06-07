import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Tab = 'fighters' | 'gyms' | 'coaches';

export default function SparcRankings() {
  const [discipline, setDiscipline] = useState<'MMA' | 'BOXING'>('MMA');
  const [tab, setTab] = useState<Tab>('fighters');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const table =
        tab === 'fighters' ? 'sparc_rankings' :
        tab === 'gyms' ? 'sparc_gym_rankings' : 'sparc_coach_rankings';
      const { data } = await supabase
        .from(table)
        .select('*')
        .eq('discipline', discipline)
        .order('points', { ascending: false })
        .limit(100);
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, [tab, discipline]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 py-4">
        <div className="font-mono text-[11px] uppercase text-muted-foreground">SPARC</div>
        <h1 className="font-display text-xl">Rankings</h1>
      </header>

      <div className="px-4 py-3 flex gap-2">
        {(['MMA', 'BOXING'] as const).map((d) => (
          <button key={d} onClick={() => setDiscipline(d)}
            className={`border px-3 py-1 font-mono text-[11px] uppercase ${discipline === d ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>
            {d}
          </button>
        ))}
      </div>

      <div className="px-4 flex gap-2 border-b border-border">
        {(['fighters', 'gyms', 'coaches'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-2 font-mono text-[11px] uppercase ${tab === t ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 py-3">
        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">No ranking entries yet.</div>
        )}
        <ol className="grid grid-cols-1 gap-1">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between border border-border px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs w-6 text-muted-foreground">{i + 1}</span>
                <span className="font-display text-sm">
                  {r.fighter_id ?? r.gym_id ?? r.coach_id}
                </span>
              </div>
              <span className="font-mono text-xs">{Number(r.points).toFixed(0)} pts</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
