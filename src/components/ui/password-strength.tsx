import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  level: number;
  label: string;
  color: string;
  progressColor: string;
}

function getPasswordStrength(pwd: string): StrengthResult {
  if (!pwd || pwd.length < 6) {
    return { level: 0, label: 'Débil', color: 'text-destructive', progressColor: '[&>div]:bg-destructive' };
  }

  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) {
    return { level: 1, label: 'Débil', color: 'text-destructive', progressColor: '[&>div]:bg-destructive' };
  }
  if (score <= 3) {
    return { level: 2, label: 'Media', color: 'text-yellow-500', progressColor: '[&>div]:bg-yellow-500' };
  }
  return { level: 3, label: 'Fuerte', color: 'text-green-500', progressColor: '[&>div]:bg-green-500' };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const progressValue = (strength.level / 3) * 100;

  return (
    <div className="space-y-1.5 mt-2">
      <Progress
        value={progressValue}
        className={cn("h-1.5 bg-muted", strength.progressColor)}
      />
      <p className={cn("text-xs font-medium", strength.color)}>
        Seguridad: {strength.label}
      </p>
    </div>
  );
}
