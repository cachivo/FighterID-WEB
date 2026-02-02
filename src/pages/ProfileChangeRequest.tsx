import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { useProfileChangeRequests } from '@/hooks/useProfileChangeRequests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, AlertTriangle, Send, User, FileText, CheckCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { classifyChanges, getFieldLabel } from '@/lib/constants/fieldApprovalRules';
const WEIGHT_CLASSES = [
  { value: 'Peso Paja', label: 'Peso Paja (115 lbs)' },
  { value: 'Peso Mosca', label: 'Peso Mosca (125 lbs)' },
  { value: 'Peso Gallo', label: 'Peso Gallo (135 lbs)' },
  { value: 'Peso Pluma', label: 'Peso Pluma (145 lbs)' },
  { value: 'Peso Ligero', label: 'Peso Ligero (155 lbs)' },
  { value: 'Peso Welter', label: 'Peso Welter (170 lbs)' },
  { value: 'Peso Medio', label: 'Peso Medio (185 lbs)' },
  { value: 'Peso Semipesado', label: 'Peso Semipesado (205 lbs)' },
  { value: 'Peso Pesado', label: 'Peso Pesado (265 lbs)' },
  { value: 'Peso Superpesado', label: 'Peso Superpesado (+265 lbs)' },
];

const FIGHTING_STYLES = [
  'Striker', 'Grappler', 'Wrestler', 'Jiu-Jitsu', 'Boxer', 
  'Kickboxer', 'Muay Thai', 'Mixed Martial Arts'
];

const MARTIAL_ARTS = [
  'MMA', 'Boxeo', 'Kickboxing', 'Muay Thai', 'Jiu-Jitsu', 
  'Judo', 'Karate', 'Taekwondo', 'Lucha Libre', 'Grappling', 'Sambo'
] as const;

const DISCIPLINES = ['MMA', 'Boxeo', 'Judo', 'Jiu-Jitsu', 'Kickboxing', 'Muay Thai', 'Grappling', 'Karate', 'Taekwondo'] as const;

export default function ProfileChangeRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getUserFighterProfile } = useFighterProfiles();
  const { createChangeRequest } = useProfileChangeRequests();
  
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const userProfile = await getUserFighterProfile();
        if (userProfile) {
          setProfile(userProfile);
          // Pre-populate form with current data
          setFormData({
            first_name: userProfile.first_name || '',
            last_name: userProfile.last_name || '',
            nickname: userProfile.nickname || '',
            document_number: userProfile.document_number || '',
            document_type: userProfile.document_type || '',
            birthdate: userProfile.birthdate || '',
            blood_type: userProfile.blood_type || '',
            emergency_contact_name: userProfile.emergency_contact_name || '',
            emergency_contact_phone: userProfile.emergency_contact_phone || '',
            emergency_contact_relation: userProfile.emergency_contact_relation || '',
            medical_conditions: userProfile.medical_conditions || '',
            medical_allergies: userProfile.medical_allergies || '',
            weight_class: userProfile.weight_class || '',
            height_cm: userProfile.height_cm || '',
            weight_kg: userProfile.weight_kg || '',
            reach_cm: userProfile.reach_cm || '',
            fighting_style: userProfile.fighting_style || '',
            martial_arts: userProfile.martial_arts || [],
            discipline: userProfile.discipline || '',
            gym_name: userProfile.gym_name || '',
            bio: userProfile.bio || '',
            stance: userProfile.stance || '',
            gender: userProfile.gender || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMartialArtsChange = (artName: string) => {
    setFormData(prev => {
      const currentArts = prev.martial_arts || [];
      const isSelected = currentArts.includes(artName);
      
      if (isSelected) {
        return {
          ...prev,
          martial_arts: currentArts.filter(art => art !== artName)
        };
      } else {
        return {
          ...prev,
          martial_arts: [...currentArts, artName]
        };
      }
    });
  };

  const getChangedFields = () => {
    if (!profile) return {};
    
    const changes = {};
    Object.keys(formData).forEach(key => {
      const currentValue = profile[key];
      const newValue = formData[key];
      
      // Handle arrays specially
      if (Array.isArray(currentValue) && Array.isArray(newValue)) {
        if (JSON.stringify(currentValue.sort()) !== JSON.stringify(newValue.sort())) {
          changes[key] = newValue;
        }
      } else if (currentValue !== newValue) {
        // Only include if there's an actual change and new value is not empty
        if (newValue !== '' && newValue !== null && newValue !== undefined) {
          changes[key] = newValue;
        }
      }
    });
    
    return changes;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const changes = getChangedFields();
    
    if (Object.keys(changes).length === 0) {
      alert('No hay cambios para solicitar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createChangeRequest(profile.id, changes);
      navigate('/license/dashboard');
    } catch (error) {
      console.error('Error creating change request:', error);
      alert('Error al crear la solicitud de cambio. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No se encontró tu perfil de peleador. Debes crear uno primero.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const changedFields = getChangedFields();
  
  // Classify changes for display
  const classifiedChanges = useMemo(() => {
    return classifyChanges(changedFields);
  }, [changedFields]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Solicitar Cambios al Perfil</h1>
      </div>

      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Información:</strong> Algunos cambios se aplicarán inmediatamente (apodo, bio, gimnasio, etc.), 
          mientras que cambios sensibles (nombre, récord, categoría de peso) requerirán aprobación administrativa.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Nombre *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Apellido *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nickname">Apodo</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="gender">Género</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="document_type">Tipo de Documento</Label>
                <Select value={formData.document_type} onValueChange={(value) => handleInputChange('document_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="RTN">RTN</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="document_number">Número de Documento *</Label>
                <Input
                  id="document_number"
                  value={formData.document_number}
                  onChange={(e) => handleInputChange('document_number', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="birthdate">Fecha de Nacimiento *</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => handleInputChange('birthdate', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical & Emergency Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información Médica y de Emergencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="blood_type">Tipo de Sangre *</Label>
              <Select value={formData.blood_type} onValueChange={(value) => handleInputChange('blood_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de sangre" />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="emergency_contact_name">Contacto de Emergencia *</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="emergency_contact_phone">Teléfono de Emergencia *</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="emergency_contact_relation">Relación</Label>
                <Input
                  id="emergency_contact_relation"
                  value={formData.emergency_contact_relation}
                  onChange={(e) => handleInputChange('emergency_contact_relation', e.target.value)}
                  placeholder="ej: Padre, Esposa, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="medical_conditions">Condiciones Médicas</Label>
                <Textarea
                  id="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                  placeholder="Describe cualquier condición médica relevante"
                />
              </div>
              <div>
                <Label htmlFor="medical_allergies">Alergias</Label>
                <Textarea
                  id="medical_allergies"
                  value={formData.medical_allergies}
                  onChange={(e) => handleInputChange('medical_allergies', e.target.value)}
                  placeholder="Lista cualquier alergia conocida"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fighter Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Peleador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight_class">Categoría de Peso *</Label>
                <Select value={formData.weight_class} onValueChange={(value) => handleInputChange('weight_class', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEIGHT_CLASSES.map((weightClass) => (
                      <SelectItem key={weightClass.value} value={weightClass.value}>
                        {weightClass.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fighting_style">Estilo de Pelea</Label>
                <Select value={formData.fighting_style} onValueChange={(value) => handleInputChange('fighting_style', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIGHTING_STYLES.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="height_cm">Altura (cm)</Label>
                <Input
                  id="height_cm"
                  type="number"
                  value={formData.height_cm}
                  onChange={(e) => handleInputChange('height_cm', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="weight_kg">Peso (kg)</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={(e) => handleInputChange('weight_kg', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="reach_cm">Alcance (cm)</Label>
                <Input
                  id="reach_cm"
                  type="number"
                  value={formData.reach_cm}
                  onChange={(e) => handleInputChange('reach_cm', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="stance">Guardia</Label>
                <Select value={formData.stance} onValueChange={(value) => handleInputChange('stance', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ortodoxo">Ortodoxo</SelectItem>
                    <SelectItem value="Zurdo">Zurdo</SelectItem>
                    <SelectItem value="Switch">Switch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="discipline">Disciplina</Label>
              <Select value={formData.discipline} onValueChange={(value) => handleInputChange('discipline', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCIPLINES.map((discipline) => (
                    <SelectItem key={discipline} value={discipline}>
                      {discipline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Artes Marciales</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                {MARTIAL_ARTS.map((art) => (
                  <div
                    key={art}
                    className={`p-2 rounded border cursor-pointer transition-colors ${
                      formData.martial_arts?.includes(art)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border-border hover:bg-muted'
                    }`}
                    onClick={() => handleMartialArtsChange(art)}
                  >
                    <span className="text-sm">{art}</span>
                  </div>
                ))}
              </div>
              {formData.martial_arts?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.martial_arts.map((art) => (
                    <Badge key={art} variant="secondary">
                      {art}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="gym_name">Gimnasio</Label>
              <Input
                id="gym_name"
                value={formData.gym_name}
                onChange={(e) => handleInputChange('gym_name', e.target.value)}
                placeholder="Nombre del gimnasio o academia"
              />
            </div>

            <div>
              <Label htmlFor="bio">Biografía</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Cuéntanos sobre ti..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Changes Summary - Classified */}
        {Object.keys(changedFields).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Cambios</CardTitle>
              <CardDescription>
                Vista previa de los cambios según tipo de aprobación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Immediate Application */}
              {classifiedChanges.hasAutoApprove && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-700 dark:text-green-400">
                      Aplicación Inmediata (sin aprobación)
                    </span>
                  </div>
                  <div className="space-y-1 ml-6">
                    {Object.entries(classifiedChanges.autoApprove).map(([field, value]) => (
                      <div key={field} className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                        <span className="font-medium text-sm">{getFieldLabel(field)}:</span>
                        <span className="text-sm text-muted-foreground">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requires Approval */}
              {classifiedChanges.hasRequiresApproval && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      Requiere Aprobación Administrativa
                    </span>
                  </div>
                  <div className="space-y-1 ml-6">
                    {Object.entries(classifiedChanges.requiresApproval).map(([field, value]) => (
                      <div key={field} className="flex justify-between items-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                        <span className="font-medium text-sm">{getFieldLabel(field)}:</span>
                        <span className="text-sm text-muted-foreground">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Separator />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting || Object.keys(changedFields).length === 0}>
            {isSubmitting ? (
              'Procesando...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {classifiedChanges.hasRequiresApproval ? 'Enviar Cambios' : 'Aplicar Cambios'}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}