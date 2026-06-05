import { cn } from "@/lib/utils";

interface SectionDividerProps {
  title: string;
  subtitle?: string;
  className?: string;
}

/**
 * Minimal editorial divider used between landing sections.
 * Hairline + sentence-case centered label.
 */
export function SectionDivider({ title, subtitle, className }: SectionDividerProps) {
  return (
    <div className={cn("max-w-[1200px] mx-auto px-6 py-10", className)}>
      <div className="h-px bg-[var(--fid-border)]" />
      <div className="mt-6 text-center">
        <h3 className="font-mono-label text-[11px] tracking-[0.12em] text-[var(--fid-text-muted)] uppercase">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-[12px] text-white/30">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default SectionDivider;
