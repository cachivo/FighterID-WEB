import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Swords, Play, Pause, RotateCcw, StopCircle, FastForward, Trophy, RefreshCw, Volume2, VolumeX, Timer, ShieldCheck, Settings, ChevronDown } from "lucide-react";
import {
  TimeMasterLayout, FighterSelector, MatchConfig, TimerDisplay, RoundTracker,
  MatchResultDialog, AlertSettingsPanel, AlertTestPanel, RoundScoreDialog,
  type MatchResultType, type RoundScoreValue,
} from "@/components/time-master";
import { useTimeMaster } from "@/hooks/useTimeMaster";
import { useAuth } from "@/hooks/useAuth";
import { Link, useSearchParams } from "react-router-dom";

export default function TimeMaster() {
  const tm = useTimeMaster();
  const { loadFighters } = tm;
  const { user } = useAuth();
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [pendingResult, setPendingResult] = useState<{ winnerId: string | null; resultType: MatchResultType; roundNumber: number; notes?: string } | null>(null);
  const [roundScoreOpen, setRoundScoreOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<number | null>(null);
  const lastCompletedCountRef = useRef(0);
  const autoOpenedRef = useRef(false);

  useEffect(() => { loadFighters(); }, [loadFighters]);
  const [searchParams] = useSearchParams();
  const eventFightParam = searchParams.get('fightId');
  const { loadEventFight } = tm;
  useEffect(() => {
    if (eventFightParam && /^[0-9a-f-]{36}$/i.test(eventFightParam)) void loadEventFight(eventFightParam);
  }, [eventFightParam, loadEventFight]);

  // When a new round is pushed to roundsCompleted, prompt for its score
  // Sparring: no per-round scoring, result is decided at the end.
  useEffect(() => {
    if (tm.boutType === 'official' && tm.roundsCompleted.length > lastCompletedCountRef.current) {
      const last = tm.roundsCompleted[tm.roundsCompleted.length - 1];
      setEditingRound(last.roundNumber);
      setRoundScoreOpen(true);
    }
    lastCompletedCountRef.current = tm.roundsCompleted.length;
  }, [tm.roundsCompleted, tm.boutType]);

  // Outside an event, Arena Control is sparring-only.
  const { setBoutType } = tm;
  useEffect(() => {
    if (!eventFightParam && !tm.eventFightId && tm.boutType !== 'sparring') setBoutType('sparring');
  }, [eventFightParam, tm.eventFightId, tm.boutType, setBoutType]);

  // Reset auto-open guard AND any stale pending result when a new match begins.
  useEffect(() => {
    if (tm.phase === 'setup') {
      autoOpenedRef.current = false;
      setPendingResult(null);
    }
  }, [tm.phase]);

  // Auto-launch result dialog when the full fight finishes and all rounds scored
  useEffect(() => {
    if (
      tm.phase === 'finished' &&
      !autoOpenedRef.current &&
      !pendingResult &&
      !resultDialogOpen &&
      !roundScoreOpen &&
      tm.roundsCompleted.length >= tm.roundConfig
    ) {
      autoOpenedRef.current = true;
      setResultDialogOpen(true);
    }
  }, [tm.phase, tm.roundsCompleted.length, tm.roundConfig, pendingResult, resultDialogOpen, roundScoreOpen]);



  const phaseLocked = tm.phase !== 'setup';

  // Synthetic IDs for guest corners so the result dialog can identify the winner.
  const cornerAId = tm.fighterAIsGuest ? 'guest:red' : (tm.fighterAId ?? '');
  const cornerBId = tm.fighterBIsGuest ? 'guest:blue' : (tm.fighterBId ?? '');

  const judgeLabel =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    'Juez no autenticado';

  const handleSubmitResult = async (r: { winnerId: string | null; resultType: MatchResultType; notes?: string }) => {
    const snapshotRound = tm.currentRound;
    const saved = await tm.completeMatch({ ...r, roundNumber: snapshotRound });
    if (!saved) return false;
    autoOpenedRef.current = true;
    setPendingResult({ ...r, roundNumber: snapshotRound });
    setResultDialogOpen(false);
    return true;
  };



  return (
    <TimeMasterLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Swords className="h-7 w-7 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold">Arena Control</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Cronómetro profesional y gestión de pelea en arena</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-end flex-wrap">
            <Button
              variant={tm.silentMode ? "default" : "outline"}
              size="sm"
              onClick={() => tm.setSilentMode((v) => !v)}
              title={tm.silentMode ? "Desactivar modo silencioso" : "Activar modo silencioso (solo vibración)"}
              className="relative text-xs sm:text-sm px-2 sm:px-3"
            >
              {tm.silentMode ? <VolumeX className="h-4 w-4 sm:mr-1" /> : <Volume2 className="h-4 w-4 sm:mr-1" />}
              <span className="hidden sm:inline">{tm.silentMode ? "Silencio" : "Sonido"}</span>
              {tm.silentMode && tm.silentModeRemainingSec > 0 && (
                <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] sm:text-xs font-mono bg-background/20 px-1.5 py-0.5 rounded">
                  <Timer className="h-3 w-3" />
                  {`${String(Math.floor(tm.silentModeRemainingSec / 60)).padStart(2, '0')}:${String(tm.silentModeRemainingSec % 60).padStart(2, '0')}`}
                </span>
              )}
            </Button>
            <Badge variant="outline" className="uppercase tracking-wider text-[10px] sm:text-xs">
              {tm.phase}
            </Badge>
          </div>
        </div>

        {/* Judge signature strip */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider font-semibold text-primary">Juez oficial</p>
                <p className="text-sm font-medium break-words">{judgeLabel}</p>
                {user ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Actúas como juez. Tu firma digital y fecha quedarán registradas al subir el resultado.
                  </p>
                ) : (
                  <p className="text-xs text-fighter-danger mt-1">
                    Debes <Link to="/auth" className="underline">iniciar sesión</Link> para firmar y subir resultados.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {tm.eventFightId && (
          <div className="border border-primary/40 rounded-sm p-3 text-sm">
            <p className="font-medium break-words">Pelea del evento: {tm.eventFightLabel}</p>
            <p className="text-muted-foreground text-xs mt-1">Cada round y puntaje se muestra en vivo en la cartelera. Al guardar el resultado se publica el ganador y las tarjetas.</p>
          </div>
        )}

        {/* Fighter selection */}
        <section className="space-y-1" aria-label="Tipo de encuentro">
          <h2 className="text-lg font-semibold">Tipo de encuentro: {tm.eventFightId ? 'Pelea oficial' : 'Sparring'}</h2>
          <p className="text-xs text-muted-foreground">
            {tm.eventFightId ? 'Abierta desde el evento: puntaje por round y récord oficial.' : 'El resultado se marca al final. Las peleas oficiales se abren desde su evento.'}
          </p>
        </section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Peleadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
              <FighterSelector
                fighters={tm.fighterProfiles}
                selectedId={tm.fighterAId}
                onSelect={tm.selectFighterA}
                label="Esquina Roja"
                isLoading={tm.isLoading}
                corner="red"
                disabled={phaseLocked}
                isGuest={tm.fighterAIsGuest}
                guestName={tm.fighterAIsGuest ? tm.fighterAName : ''}
                onGuestNameChange={tm.setFighterAGuest}
                onClear={tm.clearFighterA}
              />
              <div className="flex items-center justify-center">
                <Badge variant="outline" className="text-sm sm:text-base font-bold px-3 py-1 sm:px-4 sm:py-2">VS</Badge>
              </div>
              <FighterSelector
                fighters={tm.fighterProfiles}
                selectedId={tm.fighterBId}
                onSelect={tm.selectFighterB}
                label="Esquina Azul"
                isLoading={tm.isLoading}
                corner="blue"
                disabled={phaseLocked}
                isGuest={tm.fighterBIsGuest}
                guestName={tm.fighterBIsGuest ? tm.fighterBName : ''}
                onGuestNameChange={tm.setFighterBGuest}
                onClear={tm.clearFighterB}
              />
            </div>
            {tm.isGuestMatch && (
              <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
                {tm.boutType === 'official' ? 'Selecciona dos peleadores registrados para una pelea oficial.' : 'Sparring con invitado: se guardará en el historial del peleador registrado.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Hidden menu: configuration & test options */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors rounded-t-md group"
                aria-label="Opciones de prueba y configuración"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Opciones de prueba y configuración</span>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-4 border-t">
                <MatchConfig
                  roundConfig={tm.roundConfig}
                  onRoundConfigChange={tm.setRoundConfig}
                  roundDuration={tm.roundDuration}
                  onRoundDurationChange={tm.setRoundDuration}
                  disabled={phaseLocked}
                />
                <AlertTestPanel
                  settings={tm.alertSettings}
                  onPreview={tm.previewAlert}
                />
                <AlertSettingsPanel
                  settings={tm.alertSettings}
                  onChange={tm.setAlertSettings}
                  onPreview={tm.previewAlert}
                />
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Timer */}
        <Card>
          <CardContent className="pt-6">
            <TimerDisplay
              timeMs={tm.timeMs}
              roundDuration={tm.roundDuration}
              isRunning={tm.isRunning}
              isPaused={tm.isPaused}
              currentRound={tm.currentRound}
              totalRounds={tm.roundConfig}
              phase={tm.phase}
              restTimeMs={tm.restTimeMs}
              fighterAName={tm.fighterAName}
              fighterBName={tm.fighterBName}
            />
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:justify-center [&>button]:w-full sm:[&>button]:w-auto">
              {tm.phase === 'setup' && (
                <Button size="lg" onClick={tm.startMatch} disabled={!tm.canStartMatch} className="min-h-[48px]">
                  <Play className="h-5 w-5 mr-2" /> Preparar Pelea
                </Button>
              )}
              {tm.phase === 'ready' && (
                <Button size="lg" onClick={tm.startRound} className="min-h-[48px]">
                  <Play className="h-5 w-5 mr-2" /> Iniciar Round {tm.currentRound}
                </Button>
              )}
              {tm.phase === 'fighting' && !tm.isPaused && (
                <Button size="lg" variant="secondary" onClick={tm.pauseRound} className="min-h-[48px]">
                  <Pause className="h-5 w-5 mr-2" /> Pausar
                </Button>
              )}
              {tm.phase === 'fighting' && tm.isPaused && (
                <Button size="lg" onClick={tm.resumeRound} className="min-h-[48px]">
                  <Play className="h-5 w-5 mr-2" /> Continuar
                </Button>
              )}
              {tm.phase === 'fighting' && (
                <>
                  <Button size="lg" variant="destructive" onClick={tm.endRound} className="min-h-[48px]">
                    <StopCircle className="h-5 w-5 mr-2" /> Terminar Round
                  </Button>
                  <Button size="lg" variant="outline" onClick={tm.resetCurrentRound} className="min-h-[48px]">
                    <RotateCcw className="h-5 w-5 mr-2" /> Reiniciar Round
                  </Button>
                </>
              )}
              {tm.phase === 'between_rounds' && (
                <Button size="lg" variant="secondary" onClick={tm.skipRestPeriod} className="min-h-[48px]">
                  <FastForward className="h-5 w-5 mr-2" /> Saltar Descanso
                </Button>
              )}
              {(tm.phase === 'fighting' || tm.phase === 'between_rounds' || tm.phase === 'ready') && (
                <Button size="lg" variant="outline" onClick={() => setResultDialogOpen(true)} className="min-h-[48px]">
                  <Trophy className="h-5 w-5 mr-2" /> Declarar Resultado
                </Button>
              )}
              {tm.phase === 'finished' && (
                <Button size="lg" onClick={tm.resetMatch} disabled={tm.isSaving || !pendingResult} className="min-h-[48px]">
                  <RefreshCw className="h-5 w-5 mr-2" /> Nueva Pelea
                </Button>

              )}
              {tm.phase === 'finished' && !pendingResult && <Button variant="outline" disabled={tm.isSaving} onClick={() => setResultDialogOpen(true)}>Guardar resultado</Button>}
              {tm.phase !== 'setup' && tm.phase !== 'finished' && (
                <Button size="lg" variant="ghost" onClick={tm.resetMatch} className="min-h-[48px]">
                  <RefreshCw className="h-5 w-5 mr-2" /> Reiniciar Todo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Round tracker */}
        <RoundTracker
          totalRounds={tm.roundConfig}
          currentRound={tm.currentRound}
          roundsCompleted={tm.roundsCompleted}
          isRestPeriod={tm.isRestPeriod}
          restTimeMs={tm.restTimeMs}
          onEditRound={(n) => { setEditingRound(n); setRoundScoreOpen(true); }}
        />
      </div>

      <RoundScoreDialog
        isOpen={roundScoreOpen}
        onClose={() => setRoundScoreOpen(false)}
        roundNumber={editingRound ?? tm.currentRound}
        fighterAName={tm.fighterAName}
        fighterBName={tm.fighterBName}
        initial={editingRound ? tm.roundsCompleted.find((r) => r.roundNumber === editingRound) : undefined}
        onSubmit={(v: RoundScoreValue) => {
          if (editingRound != null) tm.setRoundScore(editingRound, v);
          setRoundScoreOpen(false);
        }}
      />

      <MatchResultDialog
        isOpen={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        onSubmit={handleSubmitResult}
        fighterA={{ id: cornerAId, name: tm.fighterAName }}
        fighterB={{ id: cornerBId, name: tm.fighterBName }}
        currentRound={tm.currentRound}
        totalRounds={tm.roundConfig}
        rounds={tm.roundsCompleted}
        totalScoreA={tm.totalScoreA}
        totalScoreB={tm.totalScoreB}
        boutType={tm.boutType}
      />
    </TimeMasterLayout>
  );
}
