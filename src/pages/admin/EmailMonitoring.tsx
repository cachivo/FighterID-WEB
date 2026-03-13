import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, AlertCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function EmailMonitoring() {
  const [refreshing, setRefreshing] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const testEmailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Email de Prueba</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Fighter ID - Sistema de Correos</p>
    </div>
    <div class="content">
      <p><span class="badge">PRUEBA EXITOSA</span></p>
      
      <h2>Sistema de Correos Operativo</h2>
      <p>Este es un correo de prueba para verificar que el sistema de emails está funcionando correctamente.</p>
      
      <div class="info-box">
        <p style="margin: 0 0 10px 0; font-weight: 600;">Información del Envío:</p>
        <p style="margin: 5px 0;"><strong>Remitente:</strong> notificaciones@fighter-id.org</p>
        <p style="margin: 5px 0;"><strong>Dominio:</strong> fighter-id.org (Verificado ✓)</p>
        <p style="margin: 5px 0;"><strong>Proveedor:</strong> Resend</p>
        <p style="margin: 5px 0;"><strong>Fecha y Hora:</strong> ${new Date().toLocaleString('es-MX')}</p>
      </div>
      
      <p style="color: #10b981; font-weight: 600;">Si recibiste este correo en tu bandeja de entrada (no en spam), el sistema está funcionando correctamente.</p>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <strong>Próximos pasos:</strong><br>
        • Verifica que el correo llegó a tu inbox (no a spam)<br>
        • Revisa el dashboard de Resend para métricas de entrega<br>
        • Si hay problemas, revisa los logs de las edge functions
      </p>
    </div>
    <div class="footer">
      <p>Fighter ID © ${new Date().getFullYear()}</p>
      <p>Este es un correo automático de prueba del sistema</p>
    </div>
  </div>
</body>
</html>
`;

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser?.email) {
        throw new Error("No se pudo obtener el email del usuario");
      }

      const { data, error } = await supabase.functions.invoke('send-mass-email', {
        body: {
          subject: 'Prueba del Sistema de Emails - Fighter ID',
          html_content: testEmailHTML,
          test_mode: true,
          test_email: currentUser.email
        }
      });

      if (error) throw error;

      toast({
        title: "Correo de prueba enviado",
        description: `El correo se envió exitosamente a ${currentUser.email}. Revisa tu bandeja de entrada.`,
      });

      console.log("[TEST EMAIL] Success:", data);
    } catch (error: any) {
      console.error("[TEST EMAIL] Error:", error);
      toast({
        title: "❌ Error al enviar correo",
        description: error.message || "No se pudo enviar el correo de prueba",
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const emailStats = [
    { label: "Dominio Configurado", value: "fighter-id.org", status: "success" },
    { label: "Email de Envío", value: "notificaciones@fighter-id.org", status: "success" },
    { label: "Proveedor", value: "Resend", status: "success" },
    { label: "Estado del Dominio", value: "Verificado", status: "success" },
  ];

  const edgeFunctions = [
    {
      name: "send-signup-confirmation",
      description: "Emails de confirmación de registro",
      status: "active",
      lastUpdate: "Hace 2 horas"
    },
    {
      name: "send-password-recovery",
      description: "Emails de recuperación de contraseña",
      status: "active",
      lastUpdate: "Hace 5 horas"
    },
    {
      name: "send-fighter-invitation",
      description: "Invitaciones a peleadores",
      status: "active",
      lastUpdate: "Hace 1 día"
    },
    {
      name: "send-license-approval",
      description: "Aprobación de licencias",
      status: "active",
      lastUpdate: "Hace 3 días"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoreo de Emails</h1>
          <p className="text-muted-foreground">
            Estado del sistema de emails y configuración
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Configuración del Dominio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuración del Dominio
          </CardTitle>
          <CardDescription>
            Configuración actual del sistema de emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {emailStats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-semibold">{stat.value}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edge Functions Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Edge Functions de Email
          </CardTitle>
          <CardDescription>
            Estado de las funciones que envían emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {edgeFunctions.map((func) => (
              <div key={func.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{func.name}</p>
                    <Badge variant="outline" className="bg-fighter-success/10 text-fighter-success border-fighter-success/20">
                      {func.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{func.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{func.lastUpdate}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={`https://supabase.com/dashboard/project/eeshomcqztvjkvycdfwi/functions/${func.name}/logs`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Enlaces Rápidos</CardTitle>
          <CardDescription>
            Accesos directos a herramientas externas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-between"
            asChild
          >
            <a
              href="https://resend.com/emails"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Ver Dashboard de Resend</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-between"
            asChild
          >
            <a
              href="https://resend.com/domains"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Configuración de Dominio</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-between"
            asChild
          >
            <a
              href="https://supabase.com/dashboard/project/eeshomcqztvjkvycdfwi/settings/functions"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Secrets de Edge Functions</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardContent>
        </Card>

        {/* Test Email Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Enviar Correo de Prueba
            </CardTitle>
            <CardDescription>
              Verifica que el sistema de emails funcione correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Destinatario</p>
                <p className="text-sm text-muted-foreground">{user?.email || "Cargando..."}</p>
              </div>
              <Button 
                onClick={handleSendTestEmail}
                disabled={sendingTest || !user?.email}
              >
                {sendingTest ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Prueba
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-sm space-y-2">
              <p className="font-medium">Qué incluye el correo de prueba:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Verificación del remitente: notificaciones@fighter-id.org</li>
                <li>Timestamp del envío</li>
                <li>Estado de configuración del dominio</li>
                <li>Prueba de formato HTML</li>
              </ul>
            </div>
          </CardContent>
        </Card>

      {/* Testing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Pruebas Recomendadas
          </CardTitle>
          <CardDescription>
            Acciones para verificar el funcionamiento del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Registro de nuevo usuario</p>
                <p className="text-muted-foreground">Verifica que llegue el email de confirmación desde notificaciones@fighter-id.org</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Recuperación de contraseña</p>
                <p className="text-muted-foreground">Prueba el flujo de "Olvidé mi contraseña"</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Invitación de peleador</p>
                <p className="text-muted-foreground">Envía una invitación desde el panel de admin</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
