import { Link } from 'react-router-dom';
import { Shield, ArrowRight, CheckCircle, Home, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LicenseWelcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Urban Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-dot-pattern"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 lg:mb-12">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Volver al inicio</span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <div className="mx-auto mb-6 sm:mb-8 p-4 sm:p-6 rounded-full bg-primary/10 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex items-center justify-center">
              <Shield className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-primary" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4 sm:mb-6 px-2">
              ¿Eres un peleador?
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl sm:max-w-2xl mx-auto mb-6 sm:mb-8 px-4 leading-relaxed">
              Obtén tu <strong>Fighter ID</strong> oficial y conéctate al mundo global de las peleas en el deporte de combate.
            </p>
          </div>

          {/* Main Question Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12 lg:mb-16">
            <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
              <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="mx-auto mb-3 sm:mb-4 p-3 sm:p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl text-primary">¡Sí, soy peleador!</CardTitle>
                <CardDescription className="text-sm sm:text-base px-2">
                  Quiero crear mi Fighter ID y acceder a mi licencia profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Licencia oficial verificada</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Acceso a eventos profesionales</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Perfil verificado y rankings</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Portal de peleador personalizado</span>
                  </div>
                </div>
                
                <Button asChild className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold group-hover:scale-105 transition-transform">
                  <Link to="/license/auth" className="flex items-center justify-center gap-2">
                    Crear mi Fighter ID
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-muted-foreground/30 transition-all duration-300 hover:shadow-lg group">
              <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="mx-auto mb-3 sm:mb-4 p-3 sm:p-4 rounded-full bg-muted/10 group-hover:bg-muted/20 transition-colors">
                  <Compass className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl text-muted-foreground">Solo quiero explorar</CardTitle>
                <CardDescription className="text-sm sm:text-base px-2">
                  Prefiero navegar por la plataforma como espectador
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Ver eventos y peleadores</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Acceso a predicciones</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Contenido social</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Rankings y estadísticas</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold"
                  onClick={() => {
                    // Save user preference to avoid showing this page again
                    localStorage.setItem("user_preference_explorer", "true");
                    // Navigate to social feed
                    window.location.href = "/social/feed";
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    Continuar explorando
                    <Compass className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="text-center px-2 sm:px-4">
            <Card className="bg-muted/30 border-muted">
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">
                  ¿Qué es un Fighter ID?
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto leading-relaxed px-2">
                  El Fighter ID es tu licencia oficial como peleador profesional y amateur. Te permite participar en eventos oficiales, 
                  acceder a tu portal personalizado, gestionar tu carrera deportiva, y formar parte de la comunidad global 
                  de deportes de combate. Es tu identificación única y verificada en el mundo de las peleas de contacto.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}