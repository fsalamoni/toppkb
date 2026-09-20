/**
 * 🏋️ WorkoutTimer — Cronômetro de treino
 *
 * Componente reutilizável para cronometrar séries e descansos:
 * - Timer total de sessão
 * - Timer de descanso entre séries (com áudio/vibração)
 * - Próximo exercício da fila
 * - Estimativa de calorias
 *
 * Uso:
 *   <WorkoutTimer
 *     exercicios={[{nome, descansoSeg}]}
 *     onComplete={(stats) => console.log(stats)}
 *   />
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX,
  Timer as TimerIcon, Flame, ChevronRight, Square, Bell,
} from 'lucide-react';

interface ExercicioRef {
  nome: string;
  descansoSeg?: number;
  carga?: string;
  series?: number;
  reps?: number | string;
}

interface WorkoutTimerProps {
  exercicios: ExercicioRef[];
  onComplete?: (stats: { duracaoTotalSeg: number; descansoTotalSeg: number; seriesCompletadas: number }) => void;
  audioEnabled?: boolean;
}

export function WorkoutTimer({ exercicios, onComplete, audioEnabled: audioInit = true }: WorkoutTimerProps) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [exercicioIdx, setExercicioIdx] = useState(0);
  const [serieAtual, setSerieAtual] = useState(1);
  const [emDescanso, setEmDescanso] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [segundosDescanso, setSegundosDescanso] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(audioInit);
  const [descansoTotal, setDescansoTotal] = useState(0);
  const [seriesCompletadas, setSeriesCompletadas] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const exercicioAtual = exercicios[exercicioIdx];
  const totalSeriesExercicio = exercicioAtual?.series || 1;
  const descansoSeg = exercicioAtual?.descansoSeg || 60;

  // Tick principal
  useEffect(() => {
    if (!running || paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      if (emDescanso) {
        setSegundosDescanso((prev) => {
          if (prev <= 1) {
            // Som de "próxima série"
            beep();
            setEmDescanso(false);
            // Próxima série ou próximo exercício
            if (serieAtual < totalSeriesExercicio) {
              setSerieAtual((s) => s + 1);
            } else if (exercicioIdx < exercicios.length - 1) {
              setExercicioIdx((i) => i + 1);
              setSerieAtual(1);
            } else {
              // Terminou tudo
              setRunning(false);
              if (intervalRef.current) clearInterval(intervalRef.current);
              onComplete?.({
                duracaoTotalSeg: segundos,
                descansoTotalSeg: descansoTotal,
                seriesCompletadas: seriesCompletadas + 1,
              });
            }
            return 0;
          }
          // Beep nos últimos 3 segundos
          if (prev <= 3) beep(true);
          return prev - 1;
        });
      } else {
        setSegundos((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, paused, emDescanso, serieAtual, exercicioIdx, totalSeriesExercicio, exercicios.length, segundos, descansoTotal, seriesCompletadas, onComplete]);

  function beep(fim = false) {
    if (!audioEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = fim ? 880 : 660;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  }

  function start() {
    setRunning(true);
    setPaused(false);
  }

  function pause() {
    setPaused(true);
  }

  function resume() {
    setPaused(false);
  }

  function reset() {
    setRunning(false);
    setPaused(false);
    setExercicioIdx(0);
    setSerieAtual(1);
    setEmDescanso(false);
    setSegundos(0);
    setSegundosDescanso(0);
    setDescansoTotal(0);
    setSeriesCompletadas(0);
  }

  function skipDescanso() {
    setSegundosDescanso(0);
    setEmDescanso(false);
    if (serieAtual < totalSeriesExercicio) {
      setSerieAtual((s) => s + 1);
    } else if (exercicioIdx < exercicios.length - 1) {
      setExercicioIdx((i) => i + 1);
      setSerieAtual(1);
    }
  }

  function iniciarDescanso() {
    setEmDescanso(true);
    setSegundosDescanso(descansoSeg);
    setDescansoTotal((d) => d + descansoSeg);
    setSeriesCompletadas((s) => s + 1);
    beep();
  }

  function skipExercicio() {
    if (exercicioIdx < exercicios.length - 1) {
      setExercicioIdx((i) => i + 1);
      setSerieAtual(1);
      setEmDescanso(false);
      setSegundosDescanso(0);
    }
  }

  function formatTime(totalSeg: number): string {
    const min = Math.floor(totalSeg / 60);
    const seg = totalSeg % 60;
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  }

  // Estimativa de calorias (METs para treino de força ~6 METs)
  const caloriasEstimadas = Math.round((segundos / 60) * 6 * 0.0175 * 95); // assumindo 95kg

  if (exercicios.length === 0) {
    return null;
  }

  // Resumo final
  if (!running && segundos > 0 && exercicioIdx >= exercicios.length - 1 && !emDescanso) {
    return (
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardContent className="p-6 text-center">
          <Flame className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
          <div className="text-2xl font-bold mb-2">Treino completo! 🎉</div>
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Duração</div>
              <div className="font-bold">{formatTime(segundos)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Descanso</div>
              <div className="font-bold">{formatTime(descansoTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Calorias</div>
              <div className="font-bold">~{caloriasEstimadas} kcal</div>
            </div>
          </div>
          <Button onClick={reset} className="mt-4">
            <RotateCcw className="h-4 w-4 mr-1" />
            Reiniciar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-500/30">
      <CardContent className="p-4">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TimerIcon className="h-5 w-5 text-emerald-400" />
            <div className="font-semibold text-sm">Cronômetro</div>
            <Badge variant="outline" className="text-xs">
              {exercicioIdx + 1}/{exercicios.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? 'Mute' : 'Unmute'}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* TIMER PRINCIPAL */}
        <div className="text-center mb-4">
          <div className={`text-5xl font-mono font-bold ${emDescanso ? 'text-amber-400' : 'text-emerald-400'}`}>
            {emDescanso ? formatTime(segundosDescanso) : formatTime(segundos)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {emDescanso ? '🛌 Descanso' : '🔥 Tempo de sessão'}
          </div>
        </div>

        {/* EXERCÍCIO ATUAL */}
        <div className="bg-muted/30 rounded-lg p-3 mb-3">
          <div className="text-xs text-muted-foreground mb-1">Exercício atual</div>
          <div className="font-semibold text-base truncate">{exercicioAtual?.nome || '—'}</div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <Badge variant="outline">Série {serieAtual}/{totalSeriesExercicio}</Badge>
            {exercicioAtual?.carga && (
              <Badge variant="outline">{exercicioAtual.carga}</Badge>
            )}
            {exercicioAtual?.reps && (
              <Badge variant="outline">{exercicioAtual.reps} reps</Badge>
            )}
            <span className="text-muted-foreground">
              Descanso: {descansoSeg}s
            </span>
          </div>
        </div>

        {/* PRÓXIMOS */}
        {exercicioIdx < exercicios.length - 1 && (
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-1">Próximos</div>
            <div className="space-y-1">
              {exercicios.slice(exercicioIdx + 1, exercicioIdx + 3).map((ex, i) => (
                <div key={i} className="text-xs flex items-center gap-2 text-muted-foreground">
                  <ChevronRight className="h-3 w-3" />
                  <span className="truncate">{ex.nome}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATS RÁPIDAS */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
          <div>
            <div className="text-muted-foreground">Calorias</div>
            <div className="font-bold">~{caloriasEstimadas} kcal</div>
          </div>
          <div>
            <div className="text-muted-foreground">Séries</div>
            <div className="font-bold">{seriesCompletadas}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Descanso</div>
            <div className="font-bold">{formatTime(descansoTotal)}</div>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="flex gap-2">
          {!running ? (
            <Button onClick={start} className="flex-1" size="lg">
              <Play className="h-4 w-4 mr-1" />
              Iniciar
            </Button>
          ) : (
            <>
              {!emDescanso ? (
                <Button onClick={iniciarDescanso} className="flex-1" size="lg" variant="default">
                  <Bell className="h-4 w-4 mr-1" />
                  Série feita · Iniciar descanso
                </Button>
              ) : (
                <Button onClick={skipDescanso} className="flex-1" size="lg" variant="default">
                  <SkipForward className="h-4 w-4 mr-1" />
                  Pular descanso
                </Button>
              )}
              {paused ? (
                <Button onClick={resume} variant="outline">
                  <Play className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={pause} variant="outline">
                  <Pause className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
          {running && (
            <Button onClick={skipExercicio} variant="outline" size="lg">
              <Square className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
