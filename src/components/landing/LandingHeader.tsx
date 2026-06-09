import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Radio, Timer, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react';

const NAV = [
  { label: 'ARENA Live', href: '/arena', highlight: true as const, icon: Radio },
  { label: 'Peleadores', href: '/fighters' },
  { label: 'Eventos', href: '/eventos' },
  { label: 'Rankings', href: '/#rankings' },
  { label: 'Gimnasios', href: '/gimnasios' },
  { label: 'Time Master', href: '/time-master' },
];

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 80);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/');
  };

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
          {NAV.map((item) => {
            const Icon = (item as any).icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`font-mono-label text-[12px] font-medium transition-colors duration-200 inline-flex items-center gap-1.5 ${
                  item.highlight
                    ? 'text-[var(--fid-crimson)] hover:text-white'
                    : 'text-[var(--fid-text-muted)] hover:text-white'
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* ARENA - Mobile only, always visible */}
          <Link
            to="/arena"
            aria-label="ARENA Live"
            className="md:hidden h-11 w-11 grid place-items-center text-[var(--fid-crimson)] touch-manipulation"
          >
            <Radio className="h-5 w-5" />
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden sm:inline-flex items-center gap-1.5 h-9 rounded-[2px] bg-[var(--fid-crimson)] hover:bg-[var(--fid-crimson-deep)] text-white font-semibold text-[13px] px-4 transition-colors">
                  Mi cuenta
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#111111] border border-[var(--fid-border)] rounded-[2px] min-w-[200px]"
              >
                <DropdownMenuItem
                  onClick={() => navigate('/dashboard')}
                  className="font-mono text-[12px] uppercase tracking-widest cursor-pointer"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/profile/hub')}
                  className="font-mono text-[12px] uppercase tracking-widest cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 mr-2" />
                  Mi perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[var(--fid-border)]" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="font-mono text-[12px] uppercase tracking-widest cursor-pointer text-[var(--fid-crimson)] focus:text-[var(--fid-crimson)]"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                {NAV.map((item) => {
                  const Icon = (item as any).icon;
                  return (
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
                      {Icon ? <Icon className="h-4 w-4" /> : item.href === '/time-master' ? <Timer className="h-4 w-4" /> : null}
                      {item.label}
                    </a>
                  );
                })}
                <div className="h-px bg-[var(--fid-border)] my-2" />

                {user ? (
                  <>
                    <Button
                      onClick={() => { setOpen(false); navigate('/dashboard'); }}
                      className="rounded-[2px] bg-[var(--fid-crimson)] hover:bg-[var(--fid-crimson-deep)] text-white"
                    >
                      Mi cuenta
                    </Button>
                    <button
                      onClick={() => { setOpen(false); navigate('/profile/hub'); }}
                      className="font-mono-label text-[14px] text-[var(--fid-text-muted)] hover:text-white text-center py-2"
                    >
                      Mi perfil
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center justify-center gap-2 font-mono-label text-[13px] text-[var(--fid-crimson)] hover:text-white border border-[var(--fid-border)] hover:border-[var(--fid-crimson)] rounded-[2px] py-2 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => { setOpen(false); navigate('/auth'); }}
                      className="rounded-[2px] bg-[var(--fid-crimson)] hover:bg-[var(--fid-crimson-deep)] text-white"
                    >
                      Crear cuenta
                    </Button>
                    <button
                      onClick={() => { setOpen(false); navigate('/auth'); }}
                      className="font-mono-label text-[14px] text-[var(--fid-text-muted)] hover:text-white text-center py-2"
                    >
                      Iniciar sesión
                    </button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
