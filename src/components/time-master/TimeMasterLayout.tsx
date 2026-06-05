import Header from "@/components/Header";

interface TimeMasterLayoutProps {
  children: React.ReactNode;
}

export function TimeMasterLayout({ children }: TimeMasterLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 sm:pt-20 pb-12 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
