import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Trophy, User, Activity, Heart, FileText, Shield } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function RequestFighterLicense() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('personal');

  // Estados para los datos del formulario
  const [formData, setFormData] = useState({
    // Personal
    nickname: '',
    birthplace: '',
    document_type: 'DUI',
    document_number: '',
    phone: '',
    
    // Físico
    height_cm: '',
    weight_kg: '',
    reach_cm: '',
    blood_type: '',
    
    // Combate
    weight_class: '',
    discipline: 'MMA',
    fighting_style: '',
    stance: 'Orthodox',
    level: 'Amateur',
    gym_name: '',
    martial_arts: [] as string[],
    record_wins: '0',
    record_losses: '0',
    record_draws: '0',
    record_type: 'amateur',
    
    // Médico
    medical_conditions: '',
    medical_allergies: '',
    insurance_company: '',
    insurance_policy: '',
    
    // Emergencia
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    
    // Adicional
    bio: '',
    boxrec_url: '',
    tapology_url: '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para solicitar tu Fighter ID');
      return;
    }

    // Validaciones básicas
    if (!formData.weight_class) {
      toast.error('Debes seleccionar una categoría de peso');
      setCurrentTab('combat');
      return;
    }

    if (!formData.emergency_contact_name || !formData.emergency_contact_phone) {
      toast.error('Debes proporcionar información de contacto de emergencia');
      setCurrentTab('medical');
      return;
    }

    setLoading(true);

    try {
      // 1. Obtener app_user_id
      const { data: appUser, error: appUserError } = await supabase
        .from('app_user')
        .select('id, first_name, last_name, country, birthdate')
        .eq('auth_user_id', user.id)
        .single();

      if (appUserError || !appUser) {
        throw new Error('No se pudo obtener tu información de usuario');
      }

      // 2. Subir avatar si existe
      let avatarUrl = '';
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('fighter-avatars')
          .upload(fileName, photoFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('fighter-avatars')
            .getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        }
      }

      // 3. Crear fighter profile
      const { data: fighterProfile, error: profileError } = await supabase
        .from('fighter_profiles')
        .insert({
          user_id: appUser.id,
          first_name: appUser.first_name,
          last_name: appUser.last_name,
          nickname: formData.nickname || null,
          country: appUser.country,
          birthdate: appUser.birthdate,
          birthplace: formData.birthplace || null,
          document_type: formData.document_type || null,
          document_number: formData.document_number || null,
          
          // Físico
          height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          reach_cm: formData.reach_cm ? parseInt(formData.reach_cm) : null,
          blood_type: formData.blood_type || null,
          
          // Combate
          weight_class: formData.weight_class,
          discipline: formData.discipline as any,
          fighting_style: formData.fighting_style || null,
          stance: formData.stance || null,
          level: formData.level || null,
          gym_name: formData.gym_name || null,
          martial_arts: formData.martial_arts.length > 0 ? formData.martial_arts : null,
          record_wins: parseInt(formData.record_wins) || 0,
          record_losses: parseInt(formData.record_losses) || 0,
          record_draws: parseInt(formData.record_draws) || 0,
          record_type: formData.record_type || null,
          
          // Médico
          medical_conditions: formData.medical_conditions || null,
          medical_allergies: formData.medical_allergies || null,
          insurance_company: formData.insurance_company || null,
          insurance_policy: formData.insurance_policy || null,
          
          // Emergencia
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relation: formData.emergency_contact_relation || null,
          
          // Adicional
          bio: formData.bio || null,
          boxrec_url: formData.boxrec_url || null,
          tapology_url: formData.tapology_url || null,
          avatar_url: avatarUrl || null,
          
          active: true,
        })
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      // 4. Crear licencia PENDING_REVIEW
      const { error: licenseError } = await supabase
        .from('fighter_licenses')
        .insert({
          fighter_id: fighterProfile.id,
          license_number: `FGT-${new Date().getFullYear()}-PENDING`,
          status: 'PENDING_REVIEW',
          license_level: formData.level === 'Professional' ? 'PROFESSIONAL' : 'AMATEUR',
          discipline: formData.discipline as any,
          is_primary: true,
        });

      if (licenseError) {
        console.error('Error creating license:', licenseError);
        // No falla si no se crea la licencia, el perfil ya existe
      }

      toast.success('¡Solicitud enviada! Tu Fighter ID será revisada en 24-48 horas');
      navigate('/');
      
    } catch (error: any) {
      console.error('Error requesting fighter license:', error);
      toast.error(error.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              Debes iniciar sesión para solicitar tu Fighter ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/license/auth')}>
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-white hover:text-gold-400"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Button>

        <Card className="bg-slate-900/80 border-gold-500/30 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="w-16 h-16 text-gold-400" />
            </div>
            <CardTitle className="text-3xl font-bold text-white">
              Solicitud de Fighter ID
            </CardTitle>
            <CardDescription className="text-gold-200">
              Completa tu información para obtener tu licencia oficial de peleador
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="personal" className="text-xs sm:text-sm">
                  <User className="w-4 h-4 mr-1" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="physical" className="text-xs sm:text-sm">
                  <Activity className="w-4 h-4 mr-1" />
                  Físico
                </TabsTrigger>
                <TabsTrigger value="combat" className="text-xs sm:text-sm">
                  <Shield className="w-4 h-4 mr-1" />
                  Combate
                </TabsTrigger>
                <TabsTrigger value="medical" className="text-xs sm:text-sm">
                  <Heart className="w-4 h-4 mr-1" />
                  Médico
                </TabsTrigger>
                <TabsTrigger value="additional" className="text-xs sm:text-sm">
                  <FileText className="w-4 h-4 mr-1" />
                  Adicional
                </TabsTrigger>
              </TabsList>

              {/* Tab Personal */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nickname">Apodo / Nickname</Label>
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder="Ej: El Tigre"
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthplace">Lugar de Nacimiento</Label>
                    <Input
                      id="birthplace"
                      value={formData.birthplace}
                      onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                      placeholder="Ej: Tegucigalpa, Honduras"
                    />
                  </div>
                  <div>
                    <Label htmlFor="document_type">Tipo de Documento</Label>
                    <Select value={formData.document_type} onValueChange={(v) => setFormData({ ...formData, document_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DUI">DUI</SelectItem>
                        <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        <SelectItem value="Licencia">Licencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="document_number">Número de Documento *</Label>
                    <Input
                      id="document_number"
                      value={formData.document_number}
                      onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                      placeholder="Ej: 0801-1990-12345"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="photo">Foto de Perfil de Peleador</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                    {photoPreview && (
                      <img src={photoPreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                    )}
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button onClick={() => setCurrentTab('physical')}>
                    Siguiente
                  </Button>
                </div>
              </TabsContent>

              {/* Tab Físico */}
              <TabsContent value="physical" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="height_cm">Altura (cm) *</Label>
                    <Input
                      id="height_cm"
                      type="number"
                      value={formData.height_cm}
                      onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                      placeholder="175"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight_kg">Peso (kg) *</Label>
                    <Input
                      id="weight_kg"
                      type="number"
                      step="0.1"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                      placeholder="70.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reach_cm">Alcance (cm)</Label>
                    <Input
                      id="reach_cm"
                      type="number"
                      value={formData.reach_cm}
                      onChange={(e) => setFormData({ ...formData, reach_cm: e.target.value })}
                      placeholder="180"
                    />
                  </div>
                  <div>
                    <Label htmlFor="blood_type">Tipo de Sangre</Label>
                    <Select value={formData.blood_type} onValueChange={(v) => setFormData({ ...formData, blood_type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setCurrentTab('personal')}>
                    Anterior
                  </Button>
                  <Button onClick={() => setCurrentTab('combat')}>
                    Siguiente
                  </Button>
                </div>
              </TabsContent>

              {/* Tab Combate */}
              <TabsContent value="combat" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight_class">Categoría de Peso *</Label>
                    <Select value={formData.weight_class} onValueChange={(v) => setFormData({ ...formData, weight_class: v })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Strawweight">Strawweight (115 lbs)</SelectItem>
                        <SelectItem value="Flyweight">Flyweight (125 lbs)</SelectItem>
                        <SelectItem value="Bantamweight">Bantamweight (135 lbs)</SelectItem>
                        <SelectItem value="Featherweight">Featherweight (145 lbs)</SelectItem>
                        <SelectItem value="Lightweight">Lightweight (155 lbs)</SelectItem>
                        <SelectItem value="Welterweight">Welterweight (170 lbs)</SelectItem>
                        <SelectItem value="Middleweight">Middleweight (185 lbs)</SelectItem>
                        <SelectItem value="Light Heavyweight">Light Heavyweight (205 lbs)</SelectItem>
                        <SelectItem value="Heavyweight">Heavyweight (265 lbs)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discipline">Disciplina *</Label>
                    <Select value={formData.discipline} onValueChange={(v) => setFormData({ ...formData, discipline: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MMA">MMA</SelectItem>
                        <SelectItem value="Boxeo">Boxeo</SelectItem>
                        <SelectItem value="Kickboxing">Kickboxing</SelectItem>
                        <SelectItem value="MuayThai">Muay Thai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fighting_style">Estilo de Pelea</Label>
                    <Input
                      id="fighting_style"
                      value={formData.fighting_style}
                      onChange={(e) => setFormData({ ...formData, fighting_style: e.target.value })}
                      placeholder="Ej: Striker, Grappler"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stance">Guardia</Label>
                    <Select value={formData.stance} onValueChange={(v) => setFormData({ ...formData, stance: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Orthodox">Orthodox</SelectItem>
                        <SelectItem value="Southpaw">Southpaw</SelectItem>
                        <SelectItem value="Switch">Switch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="level">Nivel *</Label>
                    <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Amateur">Amateur</SelectItem>
                        <SelectItem value="Professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="gym_name">Gimnasio / Academia</Label>
                    <Input
                      id="gym_name"
                      value={formData.gym_name}
                      onChange={(e) => setFormData({ ...formData, gym_name: e.target.value })}
                      placeholder="Ej: Team Alpha MMA"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Récord (Victorias - Derrotas - Empates)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        value={formData.record_wins}
                        onChange={(e) => setFormData({ ...formData, record_wins: e.target.value })}
                        placeholder="Victorias"
                      />
                      <Input
                        type="number"
                        value={formData.record_losses}
                        onChange={(e) => setFormData({ ...formData, record_losses: e.target.value })}
                        placeholder="Derrotas"
                      />
                      <Input
                        type="number"
                        value={formData.record_draws}
                        onChange={(e) => setFormData({ ...formData, record_draws: e.target.value })}
                        placeholder="Empates"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setCurrentTab('physical')}>
                    Anterior
                  </Button>
                  <Button onClick={() => setCurrentTab('medical')}>
                    Siguiente
                  </Button>
                </div>
              </TabsContent>

              {/* Tab Médico */}
              <TabsContent value="medical" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="medical_conditions">Condiciones Médicas</Label>
                    <Textarea
                      id="medical_conditions"
                      value={formData.medical_conditions}
                      onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                      placeholder="Cualquier condición médica relevante..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="medical_allergies">Alergias</Label>
                    <Textarea
                      id="medical_allergies"
                      value={formData.medical_allergies}
                      onChange={(e) => setFormData({ ...formData, medical_allergies: e.target.value })}
                      placeholder="Alergias conocidas..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="insurance_company">Compañía de Seguros</Label>
                      <Input
                        id="insurance_company"
                        value={formData.insurance_company}
                        onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
                        placeholder="Nombre de la aseguradora"
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance_policy">Número de Póliza</Label>
                      <Input
                        id="insurance_policy"
                        value={formData.insurance_policy}
                        onChange={(e) => setFormData({ ...formData, insurance_policy: e.target.value })}
                        placeholder="Número de póliza"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-6">
                    <h3 className="font-semibold text-white mb-4">Contacto de Emergencia *</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="emergency_contact_name">Nombre Completo *</Label>
                        <Input
                          id="emergency_contact_name"
                          value={formData.emergency_contact_name}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                          placeholder="Nombre del contacto"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergency_contact_phone">Teléfono *</Label>
                        <Input
                          id="emergency_contact_phone"
                          value={formData.emergency_contact_phone}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                          placeholder="+504 9999-9999"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergency_contact_relation">Relación</Label>
                        <Input
                          id="emergency_contact_relation"
                          value={formData.emergency_contact_relation}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                          placeholder="Ej: Madre, Esposo/a"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setCurrentTab('combat')}>
                    Anterior
                  </Button>
                  <Button onClick={() => setCurrentTab('additional')}>
                    Siguiente
                  </Button>
                </div>
              </TabsContent>

              {/* Tab Adicional */}
              <TabsContent value="additional" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bio">Biografía</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Cuéntanos tu historia como peleador..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="boxrec_url">URL de BoxRec (opcional)</Label>
                    <Input
                      id="boxrec_url"
                      value={formData.boxrec_url}
                      onChange={(e) => setFormData({ ...formData, boxrec_url: e.target.value })}
                      placeholder="https://boxrec.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="tapology_url">URL de Tapology (opcional)</Label>
                    <Input
                      id="tapology_url"
                      value={formData.tapology_url}
                      onChange={(e) => setFormData({ ...formData, tapology_url: e.target.value })}
                      placeholder="https://tapology.com/..."
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setCurrentTab('medical')}>
                    Anterior
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner className="mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Trophy className="w-4 h-4 mr-2" />
                        Enviar Solicitud
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
