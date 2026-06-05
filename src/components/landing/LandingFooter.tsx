import { Link } from 'react-router-dom';

const COLS = [
  {
    title: 'Plataforma',
    links: [
      { label: 'Peleadores', href: '/fighters' },
      { label: 'Eventos', href: '/eventos' },
      { label: 'Rankings', href: '/#rankings' },
      { label: 'Gimnasios', href: '/gimnasios' },
    ],
  },
  {
    title: 'Organización',
    links: [
      { label: 'Verificar licencia', href: '/license' },
      { label: 'Ser jurado', href: '/auth' },
      { label: 'Contacto', href: '/contact' },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="bg-[var(--fid-surface)] border-t border-[var(--fid-border)] px-6 pt-20 pb-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="font-display font-bold text-[14px] tracking-[0.12em]">
              <span className="text-white">FIGHTER</span>
              <span className="text-[var(--fid-crimson)] ml-1">ID</span>
            </div>
            <p className="mt-4 text-[var(--fid-text-muted)] text-sm max-w-[280px] leading-relaxed">
              Plataforma profesional de certificación y gestión de peleadores.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <h4 className="font-mono-label text-[11px] tracking-[0.08em] text-[var(--fid-text-muted)] uppercase">
                {c.title}
              </h4>
              <ul className="mt-5 space-y-3">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      to={l.href}
                      className="text-[14px] text-[var(--fid-text-muted)] hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="font-mono-label text-[11px] tracking-[0.08em] text-[var(--fid-text-muted)] uppercase">
              Redes
            </h4>
            <div className="mt-5 flex gap-3">
              {['IG', 'FB', 'YT'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="h-9 w-9 grid place-items-center rounded-full border border-[var(--fid-border)] text-[10px] font-mono-label text-[var(--fid-text-muted)] hover:text-white hover:border-[var(--fid-border-strong)] transition-colors"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[var(--fid-border)] text-center">
          <p className="font-mono-label text-[11px] text-white/25">
            © {new Date().getFullYear()} Fighter ID. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
