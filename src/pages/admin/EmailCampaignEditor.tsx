import { useState, useRef } from 'react';
import AdminLayoutWithAI from '@/components/admin/AIAssistant/AdminLayoutWithAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Send, Users, Shield, TestTube2, Loader2, Eye } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import EmailEditor, { EditorRef, EmailEditorProps } from 'react-email-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EmailCampaignEditor() {
  const emailEditorRef = useRef<EditorRef>(null);
  const [subject, setSubject] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'fighters_only' | 'admins_only'>('all');
  const [testMode, setTestMode] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState('');

  const exportHtml = () => {
    const unlayer = emailEditorRef.current?.editor;
    
    unlayer?.exportHtml((data) => {
      const { html } = data;
      setHtmlPreview(html);
    });
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error('Por favor ingresa un asunto para el correo');
      return;
    }

    if (testMode && !testEmail.trim()) {
      toast.error('Por favor ingresa un correo para el modo de prueba');
      return;
    }

    // Exportar HTML del editor
    const unlayer = emailEditorRef.current?.editor;
    
    unlayer?.exportHtml(async (data) => {
      const { html } = data;

      if (!html || html.trim() === '') {
        toast.error('El contenido del correo está vacío');
        return;
      }

      const confirmed = confirm(
        testMode
          ? `¿Enviar correo de prueba a ${testEmail}?`
          : `¿Estás seguro de enviar este correo a todos los ${
              recipientFilter === 'all' 
                ? 'usuarios' 
                : recipientFilter === 'fighters_only' 
                ? 'peleadores' 
                : 'administradores'
            }? Esta acción no se puede deshacer.`
      );

      if (!confirmed) return;

      setSending(true);
      try {
        const { data: result, error } = await supabase.functions.invoke('send-mass-email', {
          body: {
            subject,
            html_content: html,
            recipient_filter: recipientFilter,
            test_mode: testMode,
            test_email: testEmail
          }
        });

        if (error) throw error;

        if (result.success) {
          toast.success(
            `Correos enviados exitosamente. ✅ ${result.results.success} exitosos, ❌ ${result.results.failed} fallidos`
          );
          
          // Limpiar formulario si fue exitoso
          if (result.results.failed === 0) {
            setSubject('');
            setTestEmail('');
            // Reset del editor
            unlayer?.loadBlank();
          }
        } else {
          throw new Error(result.error || 'Error desconocido');
        }
      } catch (error: any) {
        console.error('Error sending mass email:', error);
        toast.error('Error al enviar correos: ' + (error.message || 'Error desconocido'));
      } finally {
        setSending(false);
      }
    });
  };

  const onReady: EmailEditorProps['onReady'] = (unlayer) => {
    console.log('Email Editor is ready');
  };

  return (
    <AdminLayoutWithAI>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Editor de Campañas de Email</h1>
            <p className="text-muted-foreground">
              Crea correos profesionales con nuestro editor visual
            </p>
          </div>
          <Button onClick={exportHtml} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa HTML
          </Button>
        </div>

        <Alert>
          <Mail className="h-4 w-4" />
          <AlertTitle>Consejo</AlertTitle>
          <AlertDescription>
            Arrastra elementos desde el panel izquierdo para construir tu email. 
            Siempre realiza una prueba antes de enviar a toda la base de datos.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Editor Visual</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Diseña tu correo</CardTitle>
                <CardDescription>
                  Usa el editor drag-and-drop para crear emails profesionales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: '700px', border: '1px solid hsl(var(--border))' }}>
                  <EmailEditor 
                    ref={emailEditorRef} 
                    onReady={onReady}
                    minHeight="700px"
                    options={{
                      displayMode: 'email',
                      locale: 'es-ES',
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Envío</CardTitle>
                <CardDescription>
                  Define el asunto, destinatarios y opciones de envío
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Asunto del Correo *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ej: ¡Nuevo evento este fin de semana!"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {subject.length}/200 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipients">Destinatarios *</Label>
                  <Select value={recipientFilter} onValueChange={(v: any) => setRecipientFilter(v)}>
                    <SelectTrigger id="recipients">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Todos los usuarios
                        </div>
                      </SelectItem>
                      <SelectItem value="fighters_only">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Solo peleadores
                        </div>
                      </SelectItem>
                      <SelectItem value="admins_only">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Solo administradores
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="test-mode"
                    checked={testMode}
                    onCheckedChange={(checked) => setTestMode(checked as boolean)}
                  />
                  <Label htmlFor="test-mode" className="flex items-center gap-2 cursor-pointer">
                    <TestTube2 className="h-4 w-4" />
                    Modo de prueba (enviar solo a un correo)
                  </Label>
                </div>

                {testMode && (
                  <div className="space-y-2">
                    <Label htmlFor="test-email">Correo de Prueba *</Label>
                    <Input
                      id="test-email"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="tu-correo@ejemplo.com"
                    />
                  </div>
                )}

                <Button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {testMode ? 'Enviar Prueba' : 'Enviar Campaña'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {htmlPreview && (
              <Card>
                <CardHeader>
                  <CardTitle>Vista Previa HTML</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="border rounded-lg p-4 bg-white max-h-96 overflow-auto"
                    dangerouslySetInnerHTML={{ __html: htmlPreview }}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutWithAI>
  );
}