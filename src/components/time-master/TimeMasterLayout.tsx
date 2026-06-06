import Header from "@/components/Header";

interface TimeMasterLayoutProps {
  children: React.ReactNode;
}

export function TimeMasterLayout({ children }: TimeMasterLayoutProps) {
  return (
    <div className="min-h-dvh bg-background">
      <Header />
      <main className="pt-16 sm:pt-20 px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom,0px)+3rem)]">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
