import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { useDeviceCapability } from '@/lib/deviceCapability';
import { Button } from '@/components/ui/button';
import HeroCanvas from './HeroCanvas';
import StatCounter from './StatCounter';

export default function LandingHero() {
  const { stats } = useRealTimeStats();
  const { user } = useAuth();
  const { isLowEnd } = useDeviceCapability();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const liveEvent = stats?.liveEvents?.[0];
  const nextEvent = (stats as any)?.nextEvent;

  return (
    <section className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden ${mounted ? 'fid-animate' : ''}`}>
      {/* Background */}
      {isLowEnd ? (
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 20% 0%, rgba(220,38,38,0.06), transparent 60%), radial-gradient(ellipse 50% 50% at 80% 100%, rgba(220,38,38,0.04), transparent 65%), #0A0A0A',
          }}
        />
      ) : (
        <HeroCanvas />
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-[800px] mx-auto px-6 pt-24 pb-20 text-center">
        {(liveEvent || nextEvent) && (
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-10 bg-[var(--fid-crimson-muted)] border border-[var(--fid-crimson)]/30 rounded-[2px] fid-fade-up" style={{ animationDelay: '0.4s' }}>
            {liveEvent ? (
              <>
                <span className="block w-1.5 h-1.5 rounded-full bg-[var(--fid-crimson)] fid-pulse-dot" />
                <span className="font-mono-label text-[10px] font-semibold tracking-[0.12em] text-white">EN VIVO · {liveEvent.name?.toUpperCase()}</span>
              </>
            ) : (
              <span className="font-mono-label text-[10px] font-semibold tracking-[0.12em] text-white/80">PRÓXIMO · {nextEvent.name?.toUpperCase()}</span>
            )}
          </div>
        )}

        <h1 className="font-display font-extrabold text-white" style={{ fontSize: 'clamp(48px, 10vw, 120px)', lineHeight: 0.95, letterSpacing: '-0.03em' }}>
          <span className="fid-title-mask">
            <span className="fid-title-line">FIGHTER</span>
          </span>
          <span className="fid-title-mask">
            <span className="fid-title-line delay-1" style={{ color: 'var(--fid-crimson)' }}>ID</span>
          </span>
          <span className="fid-underline mx-auto" style={{ maxWidth: '60%' }} />
        </h1>

        <p className="mt-6 max-w-[480px] mx-auto text-[var(--fid-text-muted)] text-base leading-relaxed fid-fade-up" style={{ animationDelay: '0.6s' }}>
          Tu carrera de combate, certificada. La plataforma oficial de licencias,
          rankings y eventos.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 fid-fade-up" style={{ animationDelay: '0.9s' }}>
          <Button
            onClick={() => navigate(user ? '/dashboard' : '/auth')}
            className="h-12 px-7 rounded-[2px] bg-[var(--fid-crimson)] hover:bg-[var(--fid-crimson-deep)] text-white font-semibold text-[14px] tracking-[0.02em] w-full sm:w-auto"
          >
            {user ? 'Ir a mi cuenta' : 'Crea tu Fighter ID'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/fighters')}
            className="h-12 px-7 rounded-[2px] bg-transparent border border-white/15 text-white hover:bg-white/5 hover:border-white/30 font-semibold text-[14px] tracking-[0.02em] w-full sm:w-auto"
          >
            Explorar peleadores
          </Button>
        </div>

        {/* Trust strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 fid-fade-up" style={{ animationDelay: '1.1s' }}>
          {[
            { label: 'PELEADORES', value: stats?.totalFighters ?? 0 },
            { label: 'ACTIVOS', value: stats?.activeFighters ?? 0 },
            { label: 'EVENTOS', value: stats?.totalEvents ?? 0 },
            { label: 'EN VIVO', value: stats?.liveEvents?.length ?? 0 },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[var(--fid-surface)] border border-[var(--fid-border)] rounded-[2px] px-5 py-4 flex flex-col items-start gap-1"
            >
              <StatCounter
                to={s.value}
                className="font-mono-label font-bold text-white text-2xl"
              />
              <span className="font-mono-label text-[10px] tracking-[0.12em] text-[var(--fid-text-muted)]">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom blend */}
      <div
        className="absolute bottom-0 inset-x-0 h-[200px] z-[5] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #0A0A0A)' }}
      />
    </section>
  );
}
