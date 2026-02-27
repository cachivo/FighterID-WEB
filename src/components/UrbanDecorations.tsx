const UrbanDecorations = () => {
  return (
    <>
      {/* Combat ambient lighting - Red UFC */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Soft red ambient lights */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-neon-primary/12 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-purple-neon-secondary/10 rounded-full blur-3xl opacity-35"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-purple-neon-glow/15 rounded-full blur-3xl opacity-30"></div>
        
        {/* Subtle gradient overlays for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(0_84%_44%/0.06)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(0_84%_30%/0.05)_0%,transparent_60%)]"></div>
      </div>

      {/* Dramatic shadow elements */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-0">
        <div className="h-32 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>

      {/* Side urban elements */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 pointer-events-none z-0">
        <div className="w-1 h-40 bg-gradient-to-b from-transparent via-purple-neon-primary/50 to-transparent"></div>
      </div>
      <div className="fixed right-0 top-1/3 pointer-events-none z-0">
        <div className="w-1 h-32 bg-gradient-to-b from-transparent via-purple-neon-secondary/40 to-transparent"></div>
      </div>
    </>
  );
};

export default UrbanDecorations;
