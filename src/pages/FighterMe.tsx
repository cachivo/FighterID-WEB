import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFighterProfiles, FighterProfile } from '@/hooks/useFighterProfiles';
import { useStatusUpdates } from '@/hooks/useStatusUpdates';
import { useSparring } from '@/hooks/useSparring';
import { useFighterLicenses, useOrganizations } from '@/hooks/useLicenses';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Activity, Users, Plus } from 'lucide-react';

const DISCIPLINES = ['MMA','Boxeo','Judo','JiuJitsu','Kickboxing','MuayThai','Grappling','Otro'];

export default function FighterMe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getUserFighterProfile } = useFighterProfiles();
  const { organizations } = useOrganizations();
  const [profile, setProfile] = useState<FighterProfile | null>(null);

  useEffect(() => { 
    getUserFighterProfile().then(setProfile); 
  }, [getUserFighterProfile]);

  const { updates, addUpdate } = useStatusUpdates(profile?.id ?? null);
  const { inbox, createRequest, updateStatus } = useSparring(profile?.id ?? null);
  const { licenses } = useFighterLicenses(profile?.id ?? null);

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Cargando perfil...</h2>
          <p className="text-muted-foreground">Por favor espera mientras cargamos tu información</p>
        </div>
      </div>
    );
  }


  const addStatus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    const fd = new FormData(e.currentTarget);
    try {
      await addUpdate.mutateAsync({
        fighter_id: profile.id,
        weight_kg: Number(fd.get('weight_kg') || 0) || undefined,
        bodyfat_pct: Number(fd.get('bodyfat_pct') || 0) || undefined,
        injuries: String(fd.get('injuries') || '') || undefined,
        ready_to_fight: Boolean(fd.get('ready_to_fight')),
        note: String(fd.get('note') || '') || undefined,
      });
      (e.target as HTMLFormElement).reset();
      toast({ title: "Update agregado", description: "Tu estado físico ha sido actualizado" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo agregar el update", variant: "destructive" });
    }
  };

  const sendSparring = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    const fd = new FormData(e.currentTarget);
    try {
      await createRequest.mutateAsync({
        from_fighter_id: profile.id,
        to_fighter_id: String(fd.get('to_fighter_id') || '') || null,
        discipline: String(fd.get('sp_discipline') || 'MMA') as 'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro',
        weight_range: String(fd.get('weight_range') || '') || undefined,
        proposed_at: String(fd.get('proposed_at') || '') || undefined,
        location: String(fd.get('location') || '') || undefined,
        message: String(fd.get('message') || '') || undefined,
      });
      (e.target as HTMLFormElement).reset();
      toast({ title: "Solicitud enviada", description: "Tu solicitud de sparring ha sido enviada" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo enviar la solicitud", variant: "destructive" });
    }
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-fighter-success/20 text-fighter-success border-fighter-success/30';
      case 'suspended': return 'bg-fighter-danger/20 text-fighter-danger border-fighter-danger/30';
      case 'expired': return 'bg-fighter-info/20 text-fighter-info border-fighter-info/30';
      case 'pending': return 'bg-fighter-warning/20 text-fighter-warning border-fighter-warning/30';
      default: return 'bg-fighter-info/20 text-fighter-info border-fighter-info/30';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-professional-primary" />
        <h1 className="text-3xl font-bold text-professional-primary">
          Mi Fighter ID
        </h1>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Perfil de Peleador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Artes Marciales / Estilos</Label>
              <div className="p-2 bg-muted/50 rounded border">
                {profile.martial_arts && profile.martial_arts.length > 0 
                  ? profile.martial_arts.join(', ')
                  : profile.discipline || 'No especificada'
                }
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Organización</Label>
              <div className="p-2 bg-muted/50 rounded border">
                {organizations.data?.find(org => org.id === profile.organization_id)?.name || 'Sin organización'}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">División (peso)</Label>
              <div className="p-2 bg-muted/50 rounded border">
                {profile.weight_class}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Estilo</Label>
              <div className="p-2 bg-muted/50 rounded border">
                {profile.fighting_style || 'No especificado'}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">País</Label>
              <div className="p-2 bg-muted/50 rounded border">
                {profile.country}
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-muted-foreground">Biografía</Label>
              <div className="p-2 bg-muted/50 rounded border min-h-[80px]">
                {profile.bio || 'No hay biografía disponible'}
              </div>
            </div>
          </div>
          
          <div className="bg-muted/30 border border-border/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-warning/20 text-warning rounded-full p-2">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-1">
                  ¿Necesitas actualizar tu información?
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Para realizar cambios en tu perfil de peleador, debes contactar con el equipo de administración. 
                  Esto garantiza la integridad y veracidad de los datos en el sistema.
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Contacto:</strong> Envía un correo a admin@batalla.hn o comunícate a través del panel de administración.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Licencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {licenses.data?.map(license => (
              <div key={license.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div className="space-y-1">
                  <div className="font-medium">{license.license_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {license.discipline} | Expira: {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'N/A'}
                  </div>
                  {license.notes && <div className="text-sm text-muted-foreground">{license.notes}</div>}
                </div>
                <Badge className={getLicenseStatusColor(license.status)}>
                  {license.status}
                </Badge>
              </div>
            ))}
            {!licenses.data?.length && (
              <div className="text-center py-6 text-muted-foreground">
                No tienes licencias registradas aún
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Actualizaciones Físicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={addStatus} className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight_kg">Peso (kg)</Label>
              <Input name="weight_kg" type="number" step="0.1" placeholder="70.5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyfat_pct">% Grasa corporal</Label>
              <Input name="bodyfat_pct" type="number" step="0.1" placeholder="15.2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="injuries">Lesiones</Label>
              <Input name="injuries" placeholder="Ninguna" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ready_to_fight" className="flex items-center gap-2">
                <input name="ready_to_fight" type="checkbox" className="rounded" />
                Listo para pelear
              </Label>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="note">Notas</Label>
              <Input name="note" placeholder="Información adicional..." />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={addUpdate.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                {addUpdate.isPending ? 'Agregando...' : 'Agregar update'}
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            {updates.data?.map(u => (
              <div key={u.id} className="p-3 rounded-lg border border-border/50 bg-card/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-sm">
                    {new Date(u.created_at).toLocaleDateString()} - {new Date(u.created_at).toLocaleTimeString()}
                  </div>
                  <Badge variant={u.ready_to_fight ? 'default' : 'secondary'}>
                    {u.ready_to_fight ? 'Listo' : 'No listo'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Peso: {u.weight_kg ?? '—'} kg</div>
                  <div>Grasa: {u.bodyfat_pct ?? '—'}%</div>
                  <div className="col-span-2">Lesiones: {u.injuries || '—'}</div>
                  {u.note && <div className="col-span-2">Nota: {u.note}</div>}
                </div>
              </div>
            ))}
            {!updates.data?.length && (
              <div className="text-center py-6 text-muted-foreground">
                No hay updates físicos registrados
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sparring / Matchmaking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={sendSparring} className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="to_fighter_id">Para peleador específico (ID)</Label>
              <Input name="to_fighter_id" placeholder="UUID del peleador o vacío para abierto" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp_discipline">Disciplina</Label>
              <Select name="sp_discipline" defaultValue="MMA">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCIPLINES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_range">Rango de peso</Label>
              <Input name="weight_range" placeholder="155–170 lbs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposed_at">Fecha/hora propuesta</Label>
              <Input name="proposed_at" type="datetime-local" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input name="location" placeholder="Gimnasio, ciudad..." />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="message">Mensaje</Label>
              <Textarea name="message" placeholder="Información adicional sobre la solicitud..." />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={createRequest.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                {createRequest.isPending ? 'Enviando...' : 'Enviar solicitud'}
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            {inbox.data?.map(r => (
              <div key={r.id} className="p-4 rounded-lg border border-border/50 bg-card/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="font-medium">{r.discipline} - {r.weight_range}</div>
                    <div className="text-sm text-muted-foreground">
                      De: {r.from_fighter?.first_name} {r.from_fighter?.last_name} 
                      {r.from_fighter?.nickname ? ` "${r.from_fighter.nickname}"` : ''}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Para: {r.to_fighter ? `${r.to_fighter.first_name} ${r.to_fighter.last_name}` : 'Solicitud abierta'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {r.proposed_at ? `Propuesto: ${new Date(r.proposed_at).toLocaleString()}` : 'Sin fecha específica'}
                    </div>
                    {r.location && <div className="text-sm text-muted-foreground">Lugar: {r.location}</div>}
                    {r.message && <div className="text-sm mt-2 p-2 bg-background/50 rounded">{r.message}</div>}
                  </div>
                  <Badge className={r.status === 'pending' ? 'bg-fighter-warning/20 text-fighter-warning' : 
                                  r.status === 'accepted' ? 'bg-fighter-success/20 text-fighter-success' :
                                  'bg-fighter-danger/20 text-fighter-danger'}>
                    {r.status}
                  </Badge>
                </div>
                {r.status === 'pending' && r.to_fighter_id === profile.id && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => updateStatus.mutate({ id: r.id, status: 'accepted' })}
                      disabled={updateStatus.isPending}
                    >
                      Aceptar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => updateStatus.mutate({ id: r.id, status: 'declined' })}
                      disabled={updateStatus.isPending}
                    >
                      Rechazar
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {!inbox.data?.length && (
              <div className="text-center py-6 text-muted-foreground">
                No hay solicitudes de sparring
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}