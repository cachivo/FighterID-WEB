import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDeviceCapability } from '@/lib/deviceCapability';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  title: string;
  subtitle?: string;
  id?: string;
  children: ReactNode;
}

/** Editorial-framed wrapper for ranking/gym/allies sections. */
export default function SectionPanel({ title, subtitle, id, children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { isLowEnd } = useDeviceCapability();

  useEffect(() => {
    if (isLowEnd || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 80%', toggleActions: 'play none none none' },
      });
    });
    return () => ctx.revert();
  }, [isLowEnd]);

  return (
    <section id={id} className="px-6 py-16 md:py-20 bg-[var(--fid-bg)]">
      <div ref={ref} className="max-w-[1200px] mx-auto">
        <div className="mb-6">
          <h2 className="font-display font-bold text-white" style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 font-mono-label text-[12px] tracking-[0.08em] text-[var(--fid-text-muted)] uppercase">
              {subtitle}
            </p>
          )}
          <div className="mt-6 h-px bg-[var(--fid-border)]" />
        </div>
        <div className="bg-[var(--fid-surface)] border border-[var(--fid-border)] rounded-[2px] p-6 md:p-12">
          {children}
        </div>
      </div>
    </section>
  );
}
