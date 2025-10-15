import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Shield, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHasFighterLicense } from '@/hooks/useHasFighterLicense';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function FighterIDCallToAction() {
  const navigate = useNavigate();
  const { hasLicense, loading } = useHasFighterLicense();

  // No mostrar nada si ya tiene licencia o está cargando
  if (loading || hasLicense) {
    return null;
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Card className="bg-gradient-to-br from-red-950/40 via-red-900/30 to-orange-950/40 border-red-500/30 backdrop-blur-sm shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('/lovable-uploads/octagon-background.png')] opacity-5 bg-cover bg-center" />
        
        <CardHeader className="relative text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Trophy className="w-16 h-16 text-gold-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
              <div className="absolute inset-0 animate-ping">
                <Trophy className="w-16 h-16 text-gold-400 opacity-20" />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-3xl sm:text-4xl font-bold text-white mb-2">
            ¿Eres Peleador?
          </CardTitle>
          
          <CardDescription className="text-lg text-gold-200 max-w-2xl mx-auto">
            Obtén tu <span className="font-bold text-gold-400">Fighter ID oficial</span> y accede a peleas profesionales, torneos y reconocimiento internacional
          </CardDescription>
        </CardHeader>

        <CardContent className="relative">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
              <Shield className="w-10 h-10 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Licencia Digital</h3>
              <p className="text-sm text-gray-300">
                Código QR verificable con toda tu información oficial
              </p>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
              <Trophy className="w-10 h-10 text-gold-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Acceso a Eventos</h3>
              <p className="text-sm text-gray-300">
                Participa en peleas oficiales y torneos reconocidos
              </p>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
              <Award className="w-10 h-10 text-purple-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Récord Oficial</h3>
              <p className="text-sm text-gray-300">
                Tu historial de combates verificado y público
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button 
              size="lg"
              onClick={() => navigate('/license/request')}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Solicitar mi Fighter ID
            </Button>
            
            <p className="mt-4 text-sm text-gray-400">
              Proceso de aprobación en 24-48 horas
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
