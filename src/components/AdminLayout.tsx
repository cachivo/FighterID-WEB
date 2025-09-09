import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Link } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-background flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <Link to="/" className="mr-4 hover:opacity-80 transition-opacity">
              <img 
                src="/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png" 
                alt="Fighter ID" 
                className="h-8 w-auto"
              />
            </Link>
            <h1 className="text-lg font-semibold">Panel de Administración</h1>
          </header>
          <main className="flex-1 p-6 bg-muted/10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}