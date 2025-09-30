const UrbanDecorations = () => {
  return (
    <>
      {/* Urban Combat 2.0 - Enhanced decorative lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Intense magenta neon effects */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-neon-primary/25 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-neon-secondary/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-purple-neon-glow/30 rounded-full blur-3xl opacity-45"></div>
        <div className="absolute bottom-0 right-1/3 w-[350px] h-[350px] bg-cyan-neon/15 rounded-full blur-3xl opacity-35"></div>
        
        {/* Modern gradient overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(285_100%_68%/0.15)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(220_100%_60%/0.12)_0%,transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(315_90%_70%/0.08)_0%,transparent_70%)]"></div>
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