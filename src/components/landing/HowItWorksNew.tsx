import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDeviceCapability } from '@/lib/deviceCapability';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { n: '01', title: 'Crea tu cuenta', body: 'Regístrate gratis en menos de dos minutos. Tu Fighter ID se genera al instante.' },
  { n: '02', title: 'Verifica tu licencia', body: 'Sube tus documentos oficiales. Nuestro equipo valida en menos de 48 horas.' },
  { n: '03', title: 'Compite y escala', body: 'Aparece en rankings oficiales y postúlate para eventos certificados.' },
];

export default function HowItWorksNew() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { isLowEnd } = useDeviceCapability();

  useEffect(() => {
    if (isLowEnd || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.fid-hiw-card', {
        opacity: 0,
        y: 60,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 75%', toggleActions: 'play none none none' },
      });
      gsap.from('.fid-hiw-title', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 80%', toggleActions: 'play none none none' },
      });
    }, ref);
    return () => ctx.revert();
  }, [isLowEnd]);

  return (
    <section ref={ref} className="py-20 md:py-[120px] px-6 bg-[var(--fid-bg)]">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="fid-hiw-title font-display font-bold text-white" style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Cómo funciona
          </h2>
          <p className="fid-hiw-title mt-3 text-[var(--fid-text-muted)] text-base">
            Tu carrera en tres pasos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="fid-hiw-card relative bg-[var(--fid-surface)] border border-[var(--fid-border)] rounded-[2px] p-8 md:p-10 hover:border-[var(--fid-border-strong)] transition-colors duration-200"
            >
              <span
                className="absolute top-6 right-7 font-mono-label font-bold text-white/[0.08] text-[48px] leading-none select-none"
                aria-hidden
              >
                {s.n}
              </span>
              <h3 className="font-display font-semibold text-white text-lg mt-6" style={{ letterSpacing: '-0.01em' }}>
                {s.title}
              </h3>
              <p className="mt-3 text-[var(--fid-text-muted)] text-[15px] leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
