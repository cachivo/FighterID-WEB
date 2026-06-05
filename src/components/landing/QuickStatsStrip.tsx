import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import StatCounter from './StatCounter';

export default function QuickStatsStrip() {
  const { stats } = useRealTimeStats();

  const items = [
    { label: 'Peleadores registrados', value: stats?.totalFighters ?? 0 },
    { label: 'Activos este mes', value: stats?.activeFighters ?? 0 },
    { label: 'Eventos realizados', value: stats?.totalEvents ?? 0 },
    { label: 'En vivo ahora', value: stats?.liveEvents?.length ?? 0 },
  ];

  return (
    <section className="sticky top-16 z-30 bg-[var(--fid-surface)] border-y border-[var(--fid-border)]">
      <div className="max-w-[1200px] mx-auto px-6 py-5 flex gap-6 md:gap-10 overflow-x-auto no-scrollbar">
        {items.map((s) => (
          <div key={s.label} className="flex-shrink-0 flex flex-col gap-1 min-w-[140px]">
            <StatCounter
              to={s.value}
              className="font-mono-label font-bold text-[var(--fid-crimson)] text-3xl md:text-4xl"
            />
            <span className="font-mono-label text-[10px] tracking-[0.12em] text-[var(--fid-text-muted)] uppercase">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
