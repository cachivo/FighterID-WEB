import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayoutWithAI from "@/components/admin/AIAssistant/AdminLayoutWithAI";

const EmailValidation = () => {
  const [validating, setValidating] = useState(false);
  const [testingMass, setTestingMass] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const validateResendConfig = async () => {
    setValidating(true);
    setResults(null);
    
    try {
      // Test 1: Verificar que RESEND_API_KEY existe intentando enviar un test
      const { data: testData, error: testError } = await supabase.functions.invoke('send-mass-email', {
        body: {
          test_mode: true,
          test_email: 'test@fighter-id.org',
          subject: '✅ Test de configuración de Resend',
          html_content: '<h1>Sistema de emails funcionando correctamente</h1>',
          recipient_filter: 'custom'
        }
      });

      const validation = {
        resend_api_configured: !testError,
        test_email_result: testError ? 'error' : 'success',
        test_error: testError?.message || null,
        timestamp: new Date().toISOString()
      };

      setResults(validation);

      if (!testError) {
        toast({
          title: "✅ Configuración correcta",
          description: "RESEND_API_KEY está configurado y funcionando",
        });
      } else {
        toast({
          title: "❌ Error de configuración",
          description: testError.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Error al validar configuración",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const testMassEmail = async () => {
    setTestingMass(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('app_user')
        .select('email, first_name')
        .eq('auth_user_id', user.user?.id)
        .single();

      const { data, error } = await supabase.functions.invoke('send-mass-email', {
        body: {
          test_mode: true,
          test_email: profile?.email,
          subject: '📧 Test de Email Masivo - Fighter ID',
          html_content: `
            <h1 style="color: #dc2626;">¡Hola ${profile?.first_name || 'Admin'}!</h1>
            <p>Este es un email de prueba del sistema de envío masivo de Fighter ID.</p>
            <p>Si recibes este mensaje, significa que el sistema de emails está funcionando correctamente.</p>
            <div style="margin: 30px 0; padding: 20px; background: #f3f4f6; border-radius: 8px;">
              <p><strong>✅ Sistema operativo</strong></p>
              <p><strong>✅ Resend configurado</strong></p>
              <p><strong>✅ Templates funcionando</strong></p>
            </div>
          `,
          recipient_filter: 'custom'
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Email de prueba enviado",
        description: `Verifica tu bandeja: ${profile?.email}`,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Error al enviar email de prueba",
        variant: "destructive",
      });
    } finally {
      setTestingMass(false);
    }
  };

  const testAdminNotification = async () => {
    setTestingNotification(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('notify-admin-pending', {
        body: {
          entity_type: 'solicitud de licencia (TEST)',
          entity_id: 'test-' + Date.now(),
          actor_name: 'Sistema de Pruebas'
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Notificación enviada",
        description: `${data.message}. Los admins deberían recibir el email.`,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Error al enviar notificación",
        variant: "destructive",
      });
    } finally {
      setTestingNotification(false);
    }
  };

  return (
    <AdminLayoutWithAI>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Validación de Sistema de Emails</h1>
          <p className="text-muted-foreground mt-2">
            Verifica que Resend está configurado correctamente y prueba el envío de emails
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Fase 1: Validación</strong> - Verifica que RESEND_API_KEY está configurado y el dominio está verificado en Resend.
          </AlertDescription>
        </Alert>

        {/* Fase 1: Validación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Paso 1: Verificar Configuración de Resend
            </CardTitle>
            <CardDescription>
              Valida que RESEND_API_KEY está configurado en Supabase Secrets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={validateResendConfig} disabled={validating}>
              {validating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Validar Configuración
                </>
              )}
            </Button>

            {results && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  {results.resend_api_configured ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">
                    RESEND_API_KEY: {results.resend_api_configured ? 'Configurado ✅' : 'No configurado ❌'}
                  </span>
                </div>
                {results.test_error && (
                  <p className="text-sm text-destructive">{results.test_error}</p>
                )}
              </div>
            )}

            <Alert>
              <AlertDescription>
                <strong>Checklist manual:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Ir a <a href="https://resend.com/domains" target="_blank" className="underline">Resend Domains</a></li>
                  <li>Verificar que <code>fighter-id.org</code> está verificado</li>
                  <li>Verificar registros DNS (SPF, DKIM, DMARC)</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Fase 2: Tests de Envío */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Paso 2: Probar Envío de Emails
            </CardTitle>
            <CardDescription>
              Envía emails de prueba para verificar que todo funciona correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Test de Email Masivo</h3>
                  <p className="text-sm text-muted-foreground">
                    Envía un email de prueba a tu cuenta
                  </p>
                </div>
                <Button onClick={testMassEmail} disabled={testingMass} variant="outline">
                  {testingMass ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar Test
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Test de Notificación a Admins</h3>
                  <p className="text-sm text-muted-foreground">
                    Simula una solicitud de licencia y notifica a todos los admins
                  </p>
                </div>
                <Button onClick={testAdminNotification} disabled={testingNotification} variant="outline">
                  {testingNotification ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Notificar Admins
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Después de enviar los tests, verifica en <a href="https://resend.com/emails" target="_blank" className="underline">Resend Dashboard</a> que los emails se enviaron correctamente.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </AdminLayoutWithAI>
  );
};

export default EmailValidation;
