import { PageHeader } from '@/components/ui/page-header';
import { SocialSidebar } from '@/components/social/SocialSidebar';
import { UnifiedSearch } from '@/components/social/UnifiedSearch';

export default function Discover() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <SocialSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto p-6 space-y-6">
          <PageHeader 
            title="Descubrir"
            subtitle="Encuentra nuevos usuarios y contenido interesante"
            showBackButton={false}
          />

          <UnifiedSearch />
        </div>
      </main>
    </div>
  );
}
