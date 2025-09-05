import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFighterProfiles, FighterProfile } from '@/hooks/useFighterProfiles';
import { ArrowLeft, Download, QrCode, Shield, Calendar, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function FighterLicense() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getFighterById } = useFighterProfiles();
  const [fighter, setFighter] = useState<FighterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFighter = async () => {
      if (!id) return;
      
      try {
        const data = await getFighterById(id);
        setFighter(data);
      } catch (error) {
        console.error('Error fetching fighter:', error);
        setFighter(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFighter();
  }, [id, getFighterById]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-fighter-success text-white';
      case 'suspended': return 'bg-fighter-danger text-white';
      case 'expired': return 'bg-fighter-info text-white';
      default: return 'bg-fighter-info text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'ACTIVA';
      case 'suspended': return 'SUSPENDIDA';
      case 'expired': return 'VENCIDA';
      default: return 'DESCONOCIDO';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando licencia...</div>
      </div>
    );
  }

  if (!fighter) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <div className="text-lg">Licencia no encontrada</div>
        <Button onClick={() => navigate('/fighters')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Peleadores
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/fighters')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </div>

        {/* License Card */}
        <Card className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-2 border-primary/20 shadow-2xl">
          <div className="p-8 space-y-6">
            {/* Header with logo and title */}
            <div className="text-center border-b border-primary/20 pb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-primary">FIGHTER ID</h1>
              </div>
              <p className="text-sm text-muted-foreground">Federación de Combate Honduras</p>
            </div>

            {/* Fighter Info */}
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={fighter.avatar_url} alt={`${fighter.first_name} ${fighter.last_name}`} />
                <AvatarFallback className="text-lg font-bold">
                  {fighter.first_name.charAt(0)}{fighter.last_name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-xl font-bold">
                    {fighter.first_name} {fighter.last_name}
                  </h2>
                  {fighter.nickname && (
                    <p className="text-lg text-muted-foreground">"{fighter.nickname}"</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">País:</span>
                    <span className="ml-2">{fighter.country}</span>
                  </div>
                  <div>
                    <span className="font-medium">División:</span>
                    <span className="ml-2">{fighter.weight_class}</span>
                  </div>
                  <div>
                    <span className="font-medium">Record:</span>
                    <span className="ml-2">{fighter.record_wins}-{fighter.record_losses}-{fighter.record_draws}</span>
                  </div>
                  {((fighter.martial_arts && fighter.martial_arts.length > 0) || fighter.discipline) && (
                    <div className="col-span-2">
                      <span className="font-medium">Artes Marciales:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {fighter.martial_arts && fighter.martial_arts.length > 0 
                          ? fighter.martial_arts.map(art => (
                              <Badge key={art} variant="secondary" className="text-xs">
                                {art}
                              </Badge>
                            ))
                          : fighter.discipline && (
                              <Badge variant="secondary" className="text-xs">
                                {fighter.discipline}
                              </Badge>
                            )
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* License Details */}
            <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="font-medium">Licencia No:</span>
                </div>
                <span className="font-mono text-lg font-bold">{fighter.license_number || 'N/A'}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Emisión:</span>
                  <span>{fighter.license_issued_date ? new Date(fighter.license_issued_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Vencimiento:</span>
                  <span>{fighter.license_expires_date ? new Date(fighter.license_expires_date).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-medium">Estado:</span>
                <Badge className={getStatusColor(fighter.license_status || 'active')}>
                  {getStatusText(fighter.license_status || 'active')}
                </Badge>
              </div>
            </div>

            {/* QR Code Area */}
            <div className="text-center py-4">
              <div className="inline-block p-4 bg-white rounded-lg shadow-inner">
                <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded">
                  <QrCode className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Código QR para verificación digital
              </p>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground border-t border-primary/20 pt-4">
              <p>Esta licencia es válida únicamente para competencias oficiales</p>
              <p>Verificar autenticidad en: batalla.gg/verify/{fighter.license_number}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}