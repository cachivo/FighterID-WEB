import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import mmaRingBg from "@/assets/mma-ring-background.png";

const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${mmaRingBg})` }}
    >
      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 px-4 text-center max-w-2xl">
        {/* Logo/Title */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-wider">
            FIGHTER ID
          </h1>
          <p className="text-xl md:text-2xl text-white/90">
            Plataforma profesional de gestión de peleadores
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-12">
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="flex-1 h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-white"
          >
            Iniciar Sesión
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            variant="outline"
            className="flex-1 h-14 text-lg font-semibold bg-white/10 hover:bg-white/20 text-white border-white/30"
          >
            Crear Cuenta
          </Button>
        </div>

        {/* Additional info */}
        <div className="mt-8 text-white/70 text-sm">
          <p>Únete a la comunidad de peleadores profesionales</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
