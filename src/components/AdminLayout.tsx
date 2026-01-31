import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Link } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      {/* Desktop-only warning for small screens */}
      <div className="lg:hidden min-h-screen w-screen flex items-center justify-center p-4 bg-background overflow-hidden">
        <div className="text-center space-y-4 max-w-[90vw]">
          <h1 className="text-xl font-bold text-destructive">Acceso Restringido</h1>
          <p className="text-sm text-muted-foreground">
            El panel de administración solo está disponible en computadores de escritorio. 
            Por favor accede desde un dispositivo con pantalla más grande.
          </p>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex min-h-screen w-full overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-background flex items-center px-4 shrink-0">
            <SidebarTrigger className="mr-2 shrink-0" />
            <Link to="/" className="mr-2 shrink-0 hover:opacity-80 transition-opacity">
              <img 
                src="/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png" 
                alt="Fighter ID" 
                className="h-7 w-auto"
              />
            </Link>
            <h1 className="text-base font-semibold truncate">Panel de Administración</h1>
          </header>
          <main className="flex-1 p-4 lg:p-5 bg-muted/10 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}