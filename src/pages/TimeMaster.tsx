import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, Play, Pause, RotateCcw, StopCircle, FastForward, Trophy, RefreshCw, Volume2, VolumeX, Timer, ShieldCheck } from "lucide-react";
import {
  TimeMasterLayout, FighterSelector, MatchConfig, TimerDisplay, RoundTracker,
  MatchResultDialog, RecordUpdateDialog, AlertSettingsPanel, AlertTestPanel, type MatchResultType,
} from "@/components/time-master";
import { useTimeMaster } from "@/hooks/useTimeMaster";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export default function TimeMaster() {
  const tm = useTimeMaster();
  const { user } = useAuth();
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [pendingResult, setPendingResult] = useState<{ winnerId: string | null; resultType: MatchResultType; notes?: string } | null>(null);

  useEffect(() => { tm.loadFighters(); }, [tm.loadFighters]);

  const phaseLocked = tm.phase !== 'setup';
  const winnerName = pendingResult?.winnerId
    ? (pendingResult.winnerId === tm.fighterAId ? tm.fighterAName : tm.fighterBName)
    : null;

  const judgeLabel =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    'Juez no autenticado';

  const handleSubmitResult = (r: { winnerId: string | null; resultType: MatchResultType; notes?: string }) => {
    setPendingResult(r);
    tm.finishMatch({ winnerId: r.winnerId, resultType: r.resultType, roundNumber: tm.currentRound, notes: r.notes });
    setResultDialogOpen(false);
    setRecordDialogOpen(true);
  };

  const handleConfirmRecord = async () => {
    if (!pendingResult) { setRecordDialogOpen(false); return; }
    await tm.updateFighterRecords({
      winnerId: pendingResult.winnerId,
      resultType: pendingResult.resultType,
      roundNumber: tm.currentRound,
      notes: pendingResult.notes,
    });
    setRecordDialogOpen(false);
  };

  const handleDeclineRecord = async () => {
    if (pendingResult) {
      // Audit trail: judge signed but chose not to update records
      await tm.insertVerdict({
        winnerId: pendingResult.winnerId,
        resultType: pendingResult.resultType,
        roundNumber: tm.currentRound,
        notes: pendingResult.notes,
      }, false);
    }
    setRecordDialogOpen(false);
  };

  return (
    <TimeMasterLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Swords className="h-7 w-7 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold">Time Master</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Cronómetro profesional de boxeo y gestión de pelea</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-end flex-wrap">
            <Button
              variant={tm.silentMode ? "default" : "outline"}
              size="sm"
              onClick={() => tm.setSilentMode((v) => !v)}
              title={tm.silentMode ? "Desactivar modo silencioso" : "Activar modo silencioso (solo vibración)"}
              className="relative"
            >
              {tm.silentMode ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
              {tm.silentMode ? "Silencio" : "Sonido"}
              {tm.silentMode && tm.silentModeRemainingSec > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-mono bg-background/20 px-1.5 py-0.5 rounded">
                  <Timer className="h-3 w-3" />
                  {`${String(Math.floor(tm.silentModeRemainingSec / 60)).padStart(2, '0')}:${String(tm.silentModeRemainingSec % 60).padStart(2, '0')}`}
                </span>
              )}
            </Button>
            <Badge variant="outline" className="uppercase tracking-wider">
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

        {/* Fighter selection */}
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
              />
              <div className="flex items-center justify-center">
                <Badge variant="outline" className="text-base font-bold px-4 py-2">VS</Badge>
              </div>
              <FighterSelector
                fighters={tm.fighterProfiles}
                selectedId={tm.fighterBId}
                onSelect={tm.selectFighterB}
                label="Esquina Azul"
                isLoading={tm.isLoading}
                corner="blue"
                disabled={phaseLocked}
              />
            </div>
          </CardContent>
        </Card>

        {/* Config */}
        <MatchConfig
          roundConfig={tm.roundConfig}
          onRoundConfigChange={tm.setRoundConfig}
          roundDuration={tm.roundDuration}
          onRoundDurationChange={tm.setRoundDuration}
          disabled={phaseLocked}
        />

        {/* Test alerts */}
        <AlertTestPanel
          settings={tm.alertSettings}
          onPreview={tm.previewAlert}
        />

        {/* Alert settings */}
        <AlertSettingsPanel
          settings={tm.alertSettings}
          onChange={tm.setAlertSettings}
          onPreview={tm.previewAlert}
        />

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
            />
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2 justify-center">
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
                <Button size="lg" onClick={tm.resetMatch} className="min-h-[48px]">
                  <RefreshCw className="h-5 w-5 mr-2" /> Nueva Pelea
                </Button>
              )}
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
        />
      </div>

      <MatchResultDialog
        isOpen={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        onSubmit={handleSubmitResult}
        fighterA={{ id: tm.fighterAId ?? '', name: tm.fighterAName }}
        fighterB={{ id: tm.fighterBId ?? '', name: tm.fighterBName }}
        currentRound={tm.currentRound}
      />

      <RecordUpdateDialog
        isOpen={recordDialogOpen}
        onConfirm={handleConfirmRecord}
        onDecline={handleDeclineRecord}
        fighterAName={tm.fighterAName}
        fighterBName={tm.fighterBName}
        winnerName={winnerName}
        resultType={pendingResult?.resultType ?? ''}
      />
    </TimeMasterLayout>
  );
}
