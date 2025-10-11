import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface AggressionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'red' | 'blue' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

export const AggressionButton = forwardRef<HTMLButtonElement, AggressionButtonProps>(
  ({ className, variant = 'neutral', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'rounded-lg font-bold transition-all duration-150 active:scale-95',
          'shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          {
            'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500': variant === 'red',
            'bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-500': variant === 'blue',
            'bg-muted hover:bg-muted/80 text-foreground focus-visible:ring-primary': variant === 'neutral',
          },
          {
            'text-sm px-3 py-2': size === 'sm',
            'text-base px-4 py-3': size === 'md',
            'text-lg px-6 py-4': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

AggressionButton.displayName = 'AggressionButton';
