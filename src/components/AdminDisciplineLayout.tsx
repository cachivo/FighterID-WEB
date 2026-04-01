import { useEffect, useRef } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminDisciplineSidebar } from './AdminDisciplineSidebar';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Home, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { DisciplineProvider, type AdminDiscipline } from '@/contexts/DisciplineContext';
import { useUserDisciplineAccess } from '@/hooks/useUserDisciplineAccess';
import { toast } from 'sonner';

interface Props {
  discipline: AdminDiscipline;
}

export default function AdminDisciplineLayout({ discipline }: Props) {
  const isMobile = useIsMobile();
  const { hasMMA, hasBoxeo, hasFullAccess, isLoading } = useUserDisciplineAccess();
  const toastShown = useRef(false);

  const hasAccess = hasFullAccess || (discipline === 'MMA' ? hasMMA : hasBoxeo);

  useEffect(() => {
    if (!isLoading && !hasAccess && !toastShown.current) {
      toastShown.current = true;
      toast.error(`No tienes acceso al panel de ${discipline}`);
    }
  }, [isLoading, hasAccess, discipline]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/admin" replace />;
  }

  const label = discipline === 'MMA' ? 'Panel MMA' : 'Panel Boxeo';

  return (
    <DisciplineProvider discipline={discipline}>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="flex min-h-screen w-full overflow-hidden">
          <AdminDisciplineSidebar discipline={discipline} />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 border-b border-primary/30 bg-background flex items-center px-4 shrink-0">
              <SidebarTrigger className="mr-2 shrink-0" />
              <Link to="/" className="mr-2 shrink-0 hover:opacity-80 transition-opacity">
                <img 
                  src="/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png" 
                  alt="Fighter ID" 
                  className="h-7 w-auto"
                />
              </Link>
              <h1 className="text-base ufc-label break-words leading-tight flex-1">{label}</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/admin">
                        <Home className="h-5 w-5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Volver a selección de disciplina</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </header>
            <main className="flex-1 p-3 md:p-4 lg:p-5 bg-background overflow-auto">
              <div className="max-w-7xl mx-auto">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </DisciplineProvider>
  );
}
