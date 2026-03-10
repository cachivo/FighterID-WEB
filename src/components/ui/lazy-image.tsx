import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function LazyImage({ src, alt, className, width, height, priority = false }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(priority);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || inView) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [priority, inView]);

  return (
    <div ref={ref} className={cn('relative overflow-hidden bg-muted', className)}>
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-muted" style={{ borderRadius: 'inherit' }} />
      )}
      {inView && !error && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-200',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          {...((priority ? { fetchpriority: 'high' } : {}) as any)}
        />
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
          {alt}
        </div>
      )}
    </div>
  );
}
