import { Clock, Shield, CheckCircle, FileText, AlertTriangle, Home } from 'lucide-react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function LicensePending() {
  const { user, licenseData, signOut } = useLicenseAuth();

  const getStatusSteps = () => {
    const currentStatus = licenseData?.status;
    
    return [
      {
        id: 'APPLIED',
        title: 'Solicitud Enviada',
        description: 'Tu solicitud ha sido recibida',
        icon: FileText,
        completed: ['APPLIED', 'PENDING_REVIEW', 'ACTIVE'].includes(currentStatus),
        current: currentStatus === 'APPLIED'
      },
      {
        id: 'PENDING_REVIEW',
        title: 'En Revisión',
        description: 'Un administrador está revisando tu solicitud',
        icon: Clock,
        completed: ['PENDING_REVIEW', 'ACTIVE'].includes(currentStatus),
        current: currentStatus === 'PENDING_REVIEW'
      },
      {
        id: 'ACTIVE',
        title: 'Licencia Aprobada',
        description: 'Tu licencia ha sido aprobada y está activa',
        icon: CheckCircle,
        completed: currentStatus === 'ACTIVE',
        current: currentStatus === 'ACTIVE'
      }
    ];
  };

  const steps = getStatusSteps();

  if (licenseData?.status === 'ACTIVE') {
    window.location.href = '/license/dashboard';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-urban-light p-4">
      <div className="max-w-4xl mx-auto pt-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 p-3 rounded-full bg-orange-500/10 w-fit">
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Licencia en Proceso</h1>
          <p className="text-muted-foreground">
            Tu solicitud de licencia está siendo procesada
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
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
          <Card className="mb-8 border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Tu Solicitud de Licencia
                  </CardTitle>
                  <CardDescription>
                    Número de Referencia: {licenseData.license_number}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-orange-500 text-white border-0">
                  {licenseData.status === 'APPLIED' ? 'Enviada' : 'En Revisión'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nivel Solicitado:</span>
                  <p className="font-medium">{licenseData.license_level}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha de Solicitud:</span>
                  <p className="font-medium">
                    {new Date(licenseData.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Estado del Proceso</CardTitle>
            <CardDescription>
              Seguimiento de tu solicitud de licencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="flex items-start gap-4">
                    <div className={`
                      flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                      ${step.completed 
                        ? 'bg-green-500 text-white' 
                        : step.current 
                          ? 'bg-orange-500 text-white animate-pulse' 
                          : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        step.current ? 'text-orange-600 dark:text-orange-400' : ''
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                      {step.current && (
                        <Badge variant="outline" className="mt-2 bg-orange-100 text-orange-700 border-orange-300">
                          Paso Actual
                        </Badge>
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="absolute left-5 mt-10 w-px h-6 bg-border" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-500" />
              Información Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <p>
                  <strong>Tiempo de Procesamiento:</strong> Las solicitudes de licencia 
                  suelen procesarse en 2-5 días hábiles.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <p>
                  <strong>Documentación Requerida:</strong> Asegúrate de tener tu 
                  certificado médico actualizado una vez que tu licencia sea aprobada.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <p>
                  <strong>Notificaciones:</strong> Recibirás un correo electrónico 
                  cuando el estado de tu licencia cambie.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <p>
                  <strong>Preguntas:</strong> Si tienes dudas sobre tu solicitud, 
                  contacta al equipo de administración.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}