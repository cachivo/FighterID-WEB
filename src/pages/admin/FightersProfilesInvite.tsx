import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const WEIGHT_CLASSES = [
  'Strawweight',
  'Flyweight',
  'Bantamweight',
  'Featherweight',
  'Lightweight',
  'Welterweight',
  'Middleweight',
  'Light Heavyweight',
  'Heavyweight',
  'Super Heavyweight',
];

export default function FightersProfilesInvite() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationLink, setRegistrationLink] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    weightClass: 'Lightweight',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa email, nombre y apellido',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-fighter-invitation', {
        body: formData,
      });

      if (error) throw error;

      setRegistrationLink(data.registrationLink);
      
      toast({
        title: 'Invitación enviada',
        description: `Se ha enviado un email de invitación a ${formData.email}`,
      });
      
      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        weightClass: 'Lightweight',
      });
    } catch (error: any) {
      console.error('Error enviando invitación:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar la invitación',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(registrationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copiado',
      description: 'Link copiado al portapapeles',
    });
  };

  return (
    <div className="container max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/fighters-profiles')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            Invitar Nuevo Peleador
          </h1>
          <p className="text-muted-foreground mt-1">
            Envía una invitación por email para que el peleador se registre
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Peleador</CardTitle>
          <CardDescription>
            El peleador recibirá un email con un link único para completar su registro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono (Opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+504 1234-5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="weightClass">Clase de Peso (Opcional)</Label>
              <Select
                value={formData.weightClass}
                onValueChange={(value) => setFormData({ ...formData, weightClass: value })}
              >
                <SelectTrigger id="weightClass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_CLASSES.map((weightClass) => (
                    <SelectItem key={weightClass} value={weightClass}>
                      {weightClass}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Invitación'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/fighters-profiles')}
              >
                Cancelar
              </Button>
            </div>
          </form>

          {registrationLink && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium mb-2 block">Link de Registro Generado:</Label>
              <div className="flex gap-2">
                <Input
                  value={registrationLink}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                También puedes compartir este link por WhatsApp o SMS
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
