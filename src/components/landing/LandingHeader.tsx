import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Timer } from 'lucide-react';

const NAV = [
  { label: 'Time Master', href: '/time-master', highlight: true },
  { label: 'Peleadores', href: '/fighters' },
  { label: 'Eventos', href: '/eventos' },
  { label: 'Rankings', href: '/#rankings' },
  { label: 'Gimnasios', href: '/gimnasios' },
];

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 80);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 h-16 transition-colors duration-200 ${
        scrolled
          ? 'bg-[rgba(10,10,10,0.95)] backdrop-blur-md border-b border-[var(--fid-border)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
        <Link to="/" className="font-display font-bold text-[14px] tracking-[0.12em]">
          <span className="text-white">FIGHTER</span>
          <span className="text-[var(--fid-crimson)] ml-1">ID</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`font-mono-label text-[12px] font-medium transition-colors duration-200 inline-flex items-center gap-1.5 ${
                item.highlight
                  ? 'text-[var(--fid-crimson)] hover:text-white'
                  : 'text-[var(--fid-text-muted)] hover:text-white'
              }`}
            >
              {item.highlight && <Timer className="h-3.5 w-3.5" />}
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Time Master - Mobile only, always visible */}
          <Link
            to="/time-master"
            aria-label="Time Master"
            className="md:hidden h-11 w-11 grid place-items-center text-[var(--fid-crimson)] touch-manipulation"
          >
            <Timer className="h-5 w-5" />
          </Link>

          {user ? (
            <Button
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="hidden sm:inline-flex h-9 rounded-[2px] bg-[var(--fid-crimson)] hover:bg-[var(--fid-crimson-deep)] text-white font-semibold text-[13px] px-4"
            >
              Mi cuenta
            </Button>
          ) : (
            <>
              <button
                onClick={() => navigate('/auth')}
                className="hidden sm:inline-flex font-mono-label text-[12px] font-medium text-[var(--fid-text-muted)] hover:text-white transition-colors px-2 h-9 items-center"
              >
                Iniciar sesión
              </button>
              <Button
                size="sm"
                onClick={() => navigate('/auth')}
                className="hidden sm:inline-flex h-9 rounded-[2px] bg-[var(--fid-crimson)] hover:bg-[var(--fid-crimson-deep)] text-white font-semibold text-[13px] px-4"
              >
                Crear cuenta
              </Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden h-9 w-9 grid place-items-center border border-[var(--fid-border)] rounded-[2px]"
                aria-label="Menu"
              >
                <div className="space-y-1.5">
                  <span className="block w-4 h-px bg-white" />
                  <span className="block w-4 h-px bg-white" />
                  <span className="block w-4 h-px bg-white" />
                </div>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[var(--fid-bg)] border-l border-[var(--fid-border)]">
              <div className="mt-12 flex flex-col gap-5">
                {NAV.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`font-mono-label text-[14px] inline-flex items-center gap-2 ${
                      item.highlight
                        ? 'text-[var(--fid-crimson)] font-semibold'
                        : 'text-[var(--fid-text-muted)] hover:text-white'
                    }`}
                  >
                    {item.highlight && <Timer className="h-4 w-4" />}
                    {item.label}
                  </a>
                ))}
                <div className="h-px bg-[var(--fid-border)] my-2" />
                <Button
                  onClick={() => {
                    setOpen(false);
                    navigate(user ? '/dashboard' : '/auth');
                  }}
                  className="rounded-[2px] bg-[var(--fid-crimson)] hover:bg-[var(--fid-crimson-deep)] text-white"
                >
                  {user ? 'Mi cuenta' : 'Crear cuenta'}
                </Button>
                {!user && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate('/auth');
                    }}
                    className="font-mono-label text-[14px] text-[var(--fid-text-muted)] hover:text-white text-center py-2"
                  >
                    Iniciar sesión
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
