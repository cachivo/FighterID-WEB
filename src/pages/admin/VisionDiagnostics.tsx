import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayoutWithAI from '@/components/admin/AIAssistant/AdminLayoutWithAI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

const EXPECTED_PROJECT_ID = 'eeshomcqztvjkvycdfwi';
const POLL_MS = 5000;

interface SessionData {
  id: string;
  session_token: string;
  fight_id: string | null;
  status: string;
  hud_connected: boolean;
  vision_connected: boolean;
  last_heartbeat: string | null;
  started_at: string | null;
  fighter_red_id: string | null;
  fighter_blue_id: string | null;
}

interface TelemetryEvent {
  id: number;
  fighter_corner: string | null;
  strike_type: string | null;
  confidence: number | null;
  round: number | null;
  created_at: string;
  body_hit: boolean | null;
  face_hit: boolean | null;
  speed_ms: number | null;
}

type Status = 'ok' | 'warn' | 'error';

const StatusIcon = ({ s }: { s: Status }) =>
  s === 'ok' ? <CheckCircle2 className="h-5 w-5 text-primary" /> :
  s === 'warn' ? <AlertTriangle className="h-5 w-5 text-accent-foreground" /> :
  <XCircle className="h-5 w-5 text-destructive" />;

function heartbeatAge(ts: string | null): string {
  if (!ts) return 'N/A';
  const diff = Math.round((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  return `${Math.round(diff / 60)}m ago`;
}

export default function VisionDiagnostics() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPoll, setLastPoll] = useState<Date>(new Date());

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const detectedProjectId = supabaseUrl.split('//')[1]?.split('.')[0] || '???';
  const projectMatch = detectedProjectId === EXPECTED_PROJECT_ID;

  const poll = useCallback(async () => {
    try {
      const { data: sessions } = await (supabase as any)
        .from('fight_telemetry_sessions')
        .select('id, session_token, fight_id, status, hud_connected, vision_connected, last_heartbeat, started_at, fighter_red_id, fighter_blue_id')
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1);

      const active: SessionData | null = sessions?.[0] ?? null;
      setSession(active);

      if (active) {
        const { data: evts } = await (supabase as any)
          .from('fight_telemetry_events')
          .select('id, fighter_corner, strike_type, confidence, round, created_at, body_hit, face_hit, speed_ms')
          .eq('session_id', active.id)
          .order('created_at', { ascending: false })
          .limit(10);
        setEvents(evts ?? []);
      } else {
        setEvents([]);
      }
    } catch (e) {
      console.error('Vision diagnostics poll error:', e);
    } finally {
      setLoading(false);
      setLastPoll(new Date());
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  const sessionStatus: Status = session ? 'ok' : 'warn';
  const visionStatus: Status = session?.vision_connected ? 'ok' : session ? 'warn' : 'error';
  const eventsStatus: Status = events.length > 0 ? 'ok' : 'warn';

  return (
    <AdminLayoutWithAI>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vision Diagnostics</h1>
            <p className="text-sm text-muted-foreground">HUD ↔ Vision Engine sync status</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Last poll: {lastPoll.toLocaleTimeString()}
          </div>
        </div>

        {/* Diagnostic Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Project ID */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Project ID</CardTitle>
              <StatusIcon s={projectMatch ? 'ok' : 'error'} />
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xs break-all">{detectedProjectId}</p>
              <Badge variant={projectMatch ? 'default' : 'destructive'} className="mt-2">
                {projectMatch ? '✅ Correcto' : '❌ No coincide'}
              </Badge>
            </CardContent>
          </Card>

          {/* 2. Active Session */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sesión Activa</CardTitle>
              <StatusIcon s={sessionStatus} />
            </CardHeader>
            <CardContent>
              {session ? (
                <div className="space-y-1 text-xs">
                  <p className="font-mono">ID: {session.id.slice(0, 8)}…</p>
                  <p className="font-mono">Token: {session.session_token.slice(0, 8)}…</p>
                  <p>Started: {session.started_at ? new Date(session.started_at).toLocaleTimeString() : 'N/A'}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay sesión activa</p>
              )}
            </CardContent>
          </Card>

          {/* 3. Vision Engine */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vision Engine</CardTitle>
              <StatusIcon s={visionStatus} />
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                <p>HUD: <Badge variant={session?.hud_connected ? 'default' : 'secondary'} className="ml-1">{session?.hud_connected ? 'Connected' : 'Disconnected'}</Badge></p>
                <p>Vision: <Badge variant={session?.vision_connected ? 'default' : 'secondary'} className="ml-1">{session?.vision_connected ? 'Connected' : 'Disconnected'}</Badge></p>
                <p>Heartbeat: {heartbeatAge(session?.last_heartbeat ?? null)}</p>
              </div>
            </CardContent>
          </Card>

          {/* 4. Strike Events */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Eventos de Golpe</CardTitle>
              <StatusIcon s={eventsStatus} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{events.length > 0 ? events.length : 0}</p>
              <p className="text-xs text-muted-foreground">últimos 10 eventos</p>
            </CardContent>
          </Card>
        </div>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Eventos Recientes de Telemetría</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay eventos registrados en la sesión activa.</p>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Corner</TableHead>
                      <TableHead>Strike</TableHead>
                      <TableHead>Round</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Body</TableHead>
                      <TableHead>Face</TableHead>
                      <TableHead>Speed</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-xs">{e.id}</TableCell>
                        <TableCell>
                          <Badge variant={e.fighter_corner === 'red' ? 'destructive' : 'default'}>
                            {e.fighter_corner ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>{e.strike_type ?? '—'}</TableCell>
                        <TableCell>{e.round ?? '—'}</TableCell>
                        <TableCell>{e.confidence != null ? `${(e.confidence * 100).toFixed(0)}%` : '—'}</TableCell>
                        <TableCell>{e.body_hit ? '✅' : '—'}</TableCell>
                        <TableCell>{e.face_hit ? '✅' : '—'}</TableCell>
                        <TableCell>{e.speed_ms != null ? `${e.speed_ms}ms` : '—'}</TableCell>
                        <TableCell className="text-xs">{new Date(e.created_at).toLocaleTimeString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayoutWithAI>
  );
}
