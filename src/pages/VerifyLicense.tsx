import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, MapPin, Scale, Target } from 'lucide-react';

export default function VerifyLicense() {
  const { licenseNumber } = useParams();
  const [licenseData, setLicenseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLicense = async () => {
      if (!licenseNumber) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('fighter_licenses')
          .select(`
            license_number,
            state,
            expires_at,
            issued_at,
            discipline,
            notes,
            fighter:fighter_id(
              first_name,
              last_name,
              nickname,
              weight_class,
              country,
              avatar_url
            )
          `)
          .eq('license_number', licenseNumber)
          .order('issued_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setLicenseData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLicense();
  }, [licenseNumber]);

  const getStatusInfo = (state: string) => {
    switch (state) {
      case 'active':
        return {
          color: 'bg-fighter-success/20 text-fighter-success border-fighter-success/30',
          icon: CheckCircle,
          text: 'LICENCIA VÁLIDA',
          description: 'Esta licencia está activa y permite competir oficialmente.'
        };
      case 'suspended':
        return {
          color: 'bg-fighter-danger/20 text-fighter-danger border-fighter-danger/30',
          icon: XCircle,
          text: 'LICENCIA SUSPENDIDA',
          description: 'Esta licencia está suspendida. El peleador no puede competir.'
        };
      case 'expired':
        return {
          color: 'bg-fighter-info/20 text-fighter-info border-fighter-info/30',
          icon: Clock,
          text: 'LICENCIA EXPIRADA',
          description: 'Esta licencia ha expirado y debe ser renovada.'
        };
      case 'pending':
        return {
          color: 'bg-fighter-warning/20 text-fighter-warning border-fighter-warning/30',
          icon: AlertTriangle,
          text: 'LICENCIA PENDIENTE',
          description: 'Esta licencia está pendiente de aprobación.'
        };
      default:
        return {
          color: 'bg-fighter-info/20 text-fighter-info border-fighter-info/30',
          icon: XCircle,
          text: 'ESTADO DESCONOCIDO',
          description: 'El estado de esta licencia no es válido.'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-xl w-full">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 mx-auto text-primary animate-pulse" />
              <p className="text-lg font-medium">Verificando licencia...</p>
              <p className="text-sm text-muted-foreground">Por favor espera mientras validamos la información</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-xl w-full border-red-200">
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Error de Verificación</h2>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!licenseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-xl w-full border-yellow-200">
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-yellow-700 mb-2">Licencia No Encontrada</h2>
            <p className="text-yellow-600 mb-4">
              La licencia <strong>{licenseNumber}</strong> no existe en nuestros registros.
            </p>
            <p className="text-sm text-muted-foreground">
              Verifica el número de licencia e inténtalo nuevamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(licenseData.state);
  const StatusIcon = statusInfo.icon;
  const isExpired = licenseData.expires_at && new Date(licenseData.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex items-center justify-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Verificación de Licencia</CardTitle>
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <StatusIcon className="h-6 w-6" />
            <Badge className={`${statusInfo.color} text-base px-4 py-1`}>
              {statusInfo.text}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Fighter Information */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50 border border-border/50">
            {licenseData.fighter?.avatar_url && (
              <img 
                src={licenseData.fighter.avatar_url} 
                alt="Fighter Avatar"
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold">
                {licenseData.fighter?.first_name} {licenseData.fighter?.last_name}
              </h3>
              {licenseData.fighter?.nickname && (
                <p className="text-lg text-muted-foreground">
                  "{licenseData.fighter.nickname}"
                </p>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {licenseData.fighter?.country}</span>
                <span className="flex items-center gap-1"><Scale className="h-3 w-3" /> {licenseData.fighter?.weight_class}</span>
                <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {licenseData.discipline}</span>
              </div>
            </div>
          </div>

          {/* License Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Número de Licencia</label>
                <p className="text-lg font-mono bg-background/50 p-2 rounded border">
                  {licenseData.license_number}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de Emisión</label>
                <p className="text-base">
                  {licenseData.issued_at ? new Date(licenseData.issued_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de Expiración</label>
                <p className={`text-base ${isExpired ? 'text-fighter-danger font-semibold' : ''}`}>
                  {licenseData.expires_at ? new Date(licenseData.expires_at).toLocaleDateString() : 'N/A'}
                  {isExpired && ' (EXPIRADA)'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Disciplina</label>
                <p className="text-base">{licenseData.discipline}</p>
              </div>
            </div>
          </div>

          {/* Status Description */}
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <p className="text-sm font-medium mb-2">Estado de la Licencia:</p>
            <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
          </div>

          {/* Additional Notes */}
          {licenseData.notes && (
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <p className="text-sm font-medium mb-2">Notas Adicionales:</p>
              <p className="text-sm text-muted-foreground">{licenseData.notes}</p>
            </div>
          )}

          {/* Validation Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/50">
            <p>Verificación realizada el {new Date().toLocaleString()}</p>
            <p>Sistema de Licencias Fighter ID - Batalla de los Gimnasios</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}