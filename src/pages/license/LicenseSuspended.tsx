import { AlertTriangle, Shield, Home, Mail, Phone } from 'lucide-react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

export default function LicenseSuspended() {
  const { user, licenseData, signOut } = useLicenseAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-urban-light p-4">
      <div className="max-w-4xl mx-auto pt-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 p-3 rounded-full bg-red-500/10 w-fit">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Licencia Suspendida</h1>
          <p className="text-muted-foreground">
            Tu Fighter ID ha sido temporalmente suspendido
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:bg-muted"
            >
              <Home className="h-4 w-4" />
              Pantalla Principal
            </Button>
            <Button
              variant="outline"
              onClick={signOut}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* License Info Card */}
        {licenseData && (
          <Card className="mb-8 border-destructive/30 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Estado de tu Fighter ID
                  </CardTitle>
                  <CardDescription>
                    Número de Licencia: {licenseData.license_number}
                  </CardDescription>
                </div>
                <Badge variant="destructive">
                  Suspendida
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-muted-foreground">Nivel de Licencia:</span>
                  <p className="font-medium">{licenseData.license_level}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha de Emisión:</span>
                  <p className="font-medium">
                    {new Date(licenseData.issued_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {licenseData.suspension_reason && (
                <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/30">
                  <h4 className="font-medium text-destructive mb-2">
                    Razón de la Suspensión:
                  </h4>
                  <p className="text-destructive/80 text-sm">
                    {licenseData.suspension_reason}
                  </p>
                  {licenseData.suspension_until && (
                    <p className="text-destructive/70 text-xs mt-2">
                      Suspendido hasta: {new Date(licenseData.suspension_until).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* What This Means Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>¿Qué significa esto?</CardTitle>
            <CardDescription>
              Información sobre el estado de suspensión de tu licencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                <p>
                  <strong>Estado Temporal:</strong> Tu Fighter ID ha sido suspendido temporalmente 
                  y no puedes participar en eventos oficiales mientras permanezca en este estado.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                <p>
                  <strong>Acceso Limitado:</strong> Durante la suspensión, tu acceso a ciertas 
                  funciones del sistema puede estar restringido.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                <p>
                  <strong>Proceso de Apelación:</strong> Si consideras que la suspensión es 
                  incorrecta, puedes contactar al equipo administrativo para iniciar un proceso de revisión.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                <p>
                  <strong>Reactivación:</strong> Una vez resueltos los motivos de la suspensión, 
                  tu Fighter ID podrá ser reactivado por un administrador.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-fighter-info" />
              Contacto Administrativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Para resolver el estado de tu suspensión o obtener más información, 
              puedes contactar al equipo administrativo:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-fighter-info/10 rounded-lg border border-fighter-info/30">
                <Mail className="h-4 w-4 text-fighter-info flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    Correo Electrónico
                  </p>
                  <p className="text-sm text-muted-foreground">
                    admin@batallagimnasios.com
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-fighter-info/10 rounded-lg border border-fighter-info/30">
                <Phone className="h-4 w-4 text-fighter-info flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    Soporte Administrativo
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Disponible en horario de oficina
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="bg-fighter-warning/10 p-4 rounded-lg border border-fighter-warning/30">
              <p className="text-sm text-fighter-warning">
                <strong>Importante:</strong> Al contactar al equipo administrativo, 
                incluye tu número de licencia ({licenseData?.license_number}) 
                para agilizar el proceso de revisión.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}