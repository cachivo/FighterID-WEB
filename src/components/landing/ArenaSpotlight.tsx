import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Radio, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function ArenaSpotlight() {
  const { data: liveEvent } = useQuery({
    queryKey: ['arena-spotlight-live'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sparc_events')
        .select('id, name, state, starts_at')
        .in('state', ['live', 'in_progress'])
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 60 * 1000,
  });

  const isLive = !!liveEvent;

  return (
    <section className="w-full bg-[var(--fid-bg)] py-10 sm:py-14">
      <div className="max-w-[1200px] mx-auto px-6">
        <article className="border border-[var(--fid-border)] bg-[#111111] p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <Radio className="h-3.5 w-3.5 text-[var(--fid-crimson)]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fid-text-muted)]">
                  Centro de competencia en vivo
                </span>
                {isLive && (
                  <span className="inline-flex items-center gap-1.5 ml-2 font-mono text-[10px] uppercase tracking-widest text-[var(--fid-crimson)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--fid-crimson)] animate-pulse" />
                    En vivo
                  </span>
                )}
              </div>

              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[0.95]">
                ARENA
              </h2>
              <p className="mt-4 font-body text-[15px] text-[var(--fid-text-muted)] max-w-xl leading-relaxed">
                Donde se ejecuta la competencia: peleas en vivo, scoring digital, telemetría
                y resultados que alimentan el ranking SPARC en tiempo real.
              </p>

              {isLive && liveEvent && (
                <div className="mt-4 font-mono text-[11px] uppercase tracking-widest text-white">
                  Ahora: {liveEvent.name}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
              <Link
                to="/arena"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[var(--fid-crimson)] hover:bg-[var(--fid-crimson-deep)] text-white font-semibold text-[13px] rounded-[2px] transition-colors"
              >
                Entrar a ARENA <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/sparc"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 border border-[var(--fid-border)] text-white hover:border-[var(--fid-crimson)] hover:text-[var(--fid-crimson)] font-mono text-[12px] uppercase tracking-widest rounded-[2px] transition-colors"
              >
                Eventos SPARC
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
