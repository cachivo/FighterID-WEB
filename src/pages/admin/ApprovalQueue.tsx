import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Check, X, Building2, Users, Calendar, MapPin, Clock, Loader2 } from 'lucide-react';
import {
  usePendingGyms,
  usePendingFighters,
  usePendingEvents,
  useApprovalCounts,
  useApproveItem,
  useRejectItem,
  useApprovalQueueRealtime,
  type QueueEntity,
} from '@/hooks/useApprovalQueue';

export default function ApprovalQueue() {
  useApprovalQueueRealtime();
  const counts = useApprovalCounts();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cola de Aprobación</h2>
        <p className="text-muted-foreground">
          Revisa y aprueba nuevas solicitudes de gimnasios, peleadores y eventos antes de hacerse públicos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard label="Gimnasios" count={counts.gyms} icon={Building2} />
        <SummaryCard label="Peleadores" count={counts.fighters} icon={Users} />
        <SummaryCard label="Eventos" count={counts.events} icon={Calendar} />
      </div>

      <Tabs defaultValue="gyms" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="gyms" className="flex items-center gap-2 py-2">
            <Building2 className="h-4 w-4" />
            <span>Gimnasios</span>
            {counts.gyms > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">{counts.gyms}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="fighters" className="flex items-center gap-2 py-2">
            <Users className="h-4 w-4" />
            <span>Peleadores</span>
            {counts.fighters > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">{counts.fighters}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2 py-2">
            <Calendar className="h-4 w-4" />
            <span>Eventos</span>
            {counts.events > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">{counts.events}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gyms" className="mt-4">
          <GymsList />
        </TabsContent>
        <TabsContent value="fighters" className="mt-4">
          <FightersList />
        </TabsContent>
        <TabsContent value="events" className="mt-4">
          <EventsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ label, count, icon: Icon }: { label: string; count: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{count}</div>
        </div>
        <Icon className="h-8 w-8 text-primary/40" />
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
        <Check className="h-10 w-10 mx-auto mb-2 text-primary/40" />
        <p>{message}</p>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

/* ----------------- Gyms ----------------- */
function GymsList() {
  const { data, isLoading } = usePendingGyms();
  if (isLoading) return <LoadingState />;
  if (!data || data.length === 0) return <EmptyState message="No hay gimnasios pendientes de aprobación." />;

  return (
    <div className="grid gap-3">
      {data.map((g) => (
        <PendingItemCard
          key={g.id}
          entity="gym"
          id={g.id}
          title={g.nombre}
          subtitle={[g.ciudad, g.pais].filter(Boolean).join(', ') || '—'}
          imageUrl={g.logo_url}
          createdAt={g.created_at}
          badges={(g.disciplinas ?? []).map(d => ({ label: d }))}
          extra={
            <div className="text-xs text-muted-foreground space-y-0.5">
              {g.email && <div>📧 {g.email}</div>}
              {g.telefono && <div>📞 {g.telefono}</div>}
            </div>
          }
        />
      ))}
    </div>
  );
}

/* ----------------- Fighters ----------------- */
function FightersList() {
  const { data, isLoading } = usePendingFighters();
  if (isLoading) return <LoadingState />;
  if (!data || data.length === 0) return <EmptyState message="No hay peleadores pendientes de aprobación." />;

  return (
    <div className="grid gap-3">
      {data.map((f) => {
        const fullName = [f.first_name, f.last_name].filter(Boolean).join(' ') || '(sin nombre)';
        return (
          <PendingItemCard
            key={f.id}
            entity="fighter"
            id={f.id}
            title={fullName}
            subtitle={f.nickname ? `"${f.nickname}"` : ''}
            imageUrl={f.avatar_url}
            createdAt={f.created_at}
            badges={[
              f.discipline ? { label: f.discipline, variant: 'secondary' as const } : null,
              f.level ? { label: f.level } : null,
              f.weight_class ? { label: f.weight_class } : null,
            ].filter(Boolean) as { label: string; variant?: 'secondary' | 'outline' }[]}
          />
        );
      })}
    </div>
  );
}

/* ----------------- Events ----------------- */
function EventsList() {
  const { data, isLoading } = usePendingEvents();
  if (isLoading) return <LoadingState />;
  if (!data || data.length === 0) return <EmptyState message="No hay eventos pendientes de aprobación." />;

  return (
    <div className="grid gap-3">
      {data.map((e) => (
        <PendingItemCard
          key={e.id}
          entity="event"
          id={e.id}
          title={e.name}
          subtitle={e.description ?? ''}
          imageUrl={e.poster_url}
          createdAt={e.created_at}
          badges={[{ label: e.discipline, variant: 'secondary' }]}
          extra={
            <div className="text-xs text-muted-foreground space-y-0.5">
              {(e.venue || e.city) && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[e.venue, e.city, e.country].filter(Boolean).join(', ')}
                </div>
              )}
              {e.start_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(e.start_time).toLocaleString()}
                </div>
              )}
            </div>
          }
        />
      ))}
    </div>
  );
}

/* ----------------- Shared card ----------------- */
interface PendingItemCardProps {
  entity: QueueEntity;
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  createdAt?: string | null;
  badges?: { label: string; variant?: 'secondary' | 'outline' }[];
  extra?: React.ReactNode;
}

function PendingItemCard({ entity, id, title, subtitle, imageUrl, createdAt, badges, extra }: PendingItemCardProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const approve = useApproveItem();
  const reject = useRejectItem();

  const initials = title
    .split(' ')
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 border">
              {imageUrl && <AvatarImage src={imageUrl} alt={title} />}
              <AvatarFallback>{initials || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">{title}</CardTitle>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              {createdAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Enviado: {new Date(createdAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((b, i) => (
                <Badge key={i} variant={b.variant ?? 'outline'}>{b.label}</Badge>
              ))}
            </div>
          )}
          {extra}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => approve.mutate({ entity, id })}
              disabled={approve.isPending}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-1" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRejectOpen(true)}
              disabled={reject.isPending}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo. Esta nota quedará registrada.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Motivo del rechazo (obligatorio)"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!notes.trim() || reject.isPending}
              onClick={() => {
                reject.mutate(
                  { entity, id, notes },
                  {
                    onSuccess: () => {
                      setRejectOpen(false);
                      setNotes('');
                    },
                  }
                );
              }}
            >
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
