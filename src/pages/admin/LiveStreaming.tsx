import { useState } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tv, ExternalLink, Edit, Radio, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

function convertToEmbedUrl(input: string): string {
  if (!input) return '';
  // Extract src from <iframe> tag if pasted
  const iframeMatch = input.match(/src="([^"]+)"/);
  if (iframeMatch) input = iframeMatch[1];
  // Already an embed URL
  if (input.includes('/embed/')) return input.split('"')[0];
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = input.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  // youtu.be/VIDEO_ID
  const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // youtube.com/live/VIDEO_ID
  const liveMatch = input.match(/youtube\.com\/live\/([a-zA-Z0-9_-]+)/);
  if (liveMatch) return `https://www.youtube.com/embed/${liveMatch[1]}`;
  return input;
}

export default function LiveStreaming() {
  const { events, loading, updateEventMeta } = useEvents();
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [embedUrl, setEmbedUrl] = useState('');
  const [chatUrl, setChatUrl] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming'>('all');

  const filteredEvents = events.filter(e => {
    const ls = (e.meta as any)?.live_stream || {};
    if (filter === 'live') return !!ls.is_streaming;
    if (filter === 'upcoming') return !ls.is_streaming;
    return true;
  });

  const openEditor = (event: any) => {
    const meta = event.meta || {};
    const ls = meta.live_stream || {};
    setEditingEvent(event);
    setEmbedUrl(ls.embed_url || '');
    setChatUrl(ls.chat_embed_url || '');
    setIsStreaming(ls.is_streaming || false);
  };

  const handleSave = async () => {
    if (!editingEvent) return;
    setSaving(true);
    try {
      const currentMeta = editingEvent.meta || {};
      const finalEmbedUrl = convertToEmbedUrl(embedUrl);
      await updateEventMeta(editingEvent.id, {
        ...currentMeta,
        live_stream: {
          embed_url: finalEmbedUrl,
          chat_embed_url: chatUrl || null,
          is_streaming: isStreaming,
        },
      });
      toast.success('Transmisión actualizada');
      setEditingEvent(null);
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = async (event: any, value: boolean) => {
    const currentMeta = event.meta || {};
    const ls = currentMeta.live_stream || {};
    if (!ls.embed_url && value) {
      toast.error('Configura primero la URL del embed');
      return;
    }
    try {
      await updateEventMeta(event.id, {
        ...currentMeta,
        live_stream: { ...ls, is_streaming: value },
      });
      toast.success(value ? '🔴 Transmisión activada' : 'Transmisión desactivada');
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const getLiveStream = (event: any) => (event.meta as any)?.live_stream || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tv className="h-6 w-6 text-primary" />
            Transmisiones En Vivo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona los embeds de YouTube para cada evento
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/en-vivo" target="_blank">
            <Eye className="h-4 w-4 mr-2" />
            Ver página pública
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
          {(['all', 'live', 'upcoming'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todos' : f === 'live' ? '🔴 Transmitiendo' : 'Sin Stream'}
            </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando eventos...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No hay eventos para mostrar</div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Stream URL</TableHead>
                  <TableHead>En Vivo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map(event => {
                  const ls = getLiveStream(event);
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {event.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.start_time
                          ? format(new Date(event.start_time), 'dd MMM yyyy', { locale: es })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.state === 'live' ? 'destructive' : 'secondary'}>
                          {event.state}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {ls.embed_url || '—'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!ls.is_streaming}
                          onCheckedChange={(v) => quickToggle(event, v)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEditor(event)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(o) => !o && setEditingEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Configurar Transmisión — {editingEvent?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL o Iframe de YouTube</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder={'Pega aquí el iframe completo, URL embed, o link normal de YouTube\nEj: <iframe src="https://www.youtube.com/embed/..."></iframe>'}
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Acepta: iframe completo, URL embed, youtube.com/watch?v=, youtu.be/, youtube.com/live/
              </p>
              {embedUrl && (
                <p className="text-xs text-muted-foreground">
                  Embed: {convertToEmbedUrl(embedUrl)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>URL del Chat en Vivo (opcional)</Label>
              <Input
                placeholder="https://www.youtube.com/live_chat?v=VIDEO_ID&embed_domain=..."
                value={chatUrl}
                onChange={(e) => setChatUrl(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isStreaming} onCheckedChange={setIsStreaming} />
              <Label>Transmitiendo en vivo</Label>
              {isStreaming && (
                <Badge variant="destructive" className="animate-pulse">
                  🔴 LIVE
                </Badge>
              )}
            </div>

            {/* Preview */}
            {embedUrl && (
              <div className="space-y-2">
                <Label>Vista previa</Label>
                <div className="aspect-video rounded-lg overflow-hidden border border-border bg-black">
                  <iframe
                    src={convertToEmbedUrl(embedUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
