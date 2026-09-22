/**
 * 🏋️ Treinamento · Meu Programa · ABA: PROGRESSO (aderência + stats)
 *
 * Estatísticas reais de aderência ao plano:
 * - 4 KPIs (aderência %, feitas, total, % concluído)
 * - Calendário/heatmap por dia
 * - Streak (dias consecutivos ativos)
 * - Gráfico de aderência por semana
 *
 * Extraído do TreinamentoMeuPrograma.tsx em Sprint 3 (~257 linhas).
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Trophy, Check, Flame, AlertCircle, Target } from 'lucide-react';
import { Kpi } from '@/components/common/Kpi';
import type { Plano } from '@/lib/geradorPlano';

interface ProgressoTabProps {
  plano: Plano;
  sessoesFeitas: any[];
}

export function ProgressoTab({ plano, sessoesFeitas }: ProgressoTabProps) {
  const hoje = new Date();
  const inicioPlano = useMemo(() => {
    try {
      if (!plano.criadoEm) return new Date();
      const d = new Date(plano.criadoEm);
      if (isNaN(d.getTime())) return new Date();
      return d;
    } catch {
      return new Date();
    }
  }, [plano.criadoEm]);

  const diasPassados = Math.max(0, Math.floor((hoje.getTime() - inicioPlano.getTime()) / (1000 * 60 * 60 * 24)));
  const semanaAtual = Math.min(plano.duracaoSemanas - 1, Math.floor(diasPassados / 7));
  const diasTotais = plano.duracaoSemanas * 7;

  const sessoesFeitasPlano = sessoesFeitas.filter((sf) =>
    plano.sessoes.some((ps) => ps.id === sf.planoSessaoId),
  );

  // Conta sessoesFeitasPlano por semana (deduplicando)
  const sessoesFeitasPlanoUnicas = (() => {
    const seen = new Set<string>();
    return sessoesFeitasPlano.filter((sf) => {
      if (!sf.planoSessaoId) return false;
      if (seen.has(sf.planoSessaoId)) return false;
      seen.add(sf.planoSessaoId);
      return true;
    });
  })();

  const totalSessoesPlano = plano.sessoes.length;
  const sessoesEsperadasAteHoje = (semanaAtual + 1) * plano.sessoesPorSemana;
  const aderencia = sessoesEsperadasAteHoje > 0
    ? Math.min(100, Math.round((sessoesFeitasPlanoUnicas.length / sessoesEsperadasAteHoje) * 100))
    : 0;

  const percentualConcluido = Math.round((semanaAtual / plano.duracaoSemanas) * 100);

  // Memoiza início do plano (pra usar em vários useMemo) — já memoizado acima

  // Streak — dias consecutivos com pelo menos 1 sessão
  const streak = useMemo(() => {
    const datas = new Set<string>();
    sessoesFeitasPlanoUnicas.forEach((sf) => {
      if (sf.data) {
        const d = new Date(sf.data);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        datas.add(key);
      }
    });

    let count = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    // Permite 1 dia de folga (ontem)
    const inicioTs = inicioPlano.getTime();
    while (count < 365) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (datas.has(key)) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (count === 0) {
        cursor.setDate(cursor.getDate() - 1);
        // Permite começar a contagem de ontem
        if (cursor.getTime() < inicioTs) break;
        const keyYesterday = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
        if (!datas.has(keyYesterday)) break;
      } else {
        break;
      }
    }
    return count;
  }, [sessoesFeitasPlanoUnicas, inicioPlano]);

  // Calendário do plano (heatmap de aderência)
  const diasCalendario = useMemo(() => {
    const result: Array<{ data: Date; feita: boolean; semanaIdx: number; temSessao: boolean }> = [];
    for (let i = 0; i <= diasPassados && i < diasTotais; i++) {
      const data = new Date(inicioPlano);
      data.setDate(data.getDate() + i);
      const key = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
      const feita = sessoesFeitasPlanoUnicas.some((sf) => {
        const sd = new Date(sf.data);
        const skey = `${sd.getFullYear()}-${sd.getMonth()}-${sd.getDate()}`;
        return skey === key;
      });
      result.push({
        data,
        feita,
        semanaIdx: Math.floor(i / 7),
        temSessao: true,
      });
    }
    return result;
  }, [diasPassados, diasTotais, sessoesFeitasPlanoUnicas, inicioPlano]);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Aderência" value={`${aderencia}%`} icon={Target} accent="emerald" />
        <Kpi label="Sessões feitas" value={String(sessoesFeitasPlanoUnicas.length)} icon={Check} accent="blue" />
        <Kpi label="Total no plano" value={String(totalSessoesPlano)} icon={Activity} accent="purple" />
        <Kpi label="Streak" value={streak > 0 ? `${streak}d` : '—'} icon={Flame} accent="amber" sublabel={streak > 0 ? '🔥 dias consecutivos' : 'comece hoje'} />
      </div>

      {/* BARRA DE PROGRESSO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📅 Progresso do plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Semana {semanaAtual + 1} de {plano.duracaoSemanas}</span>
              <span className="text-muted-foreground">{diasPassados} / {diasTotais} dias</span>
            </div>
            <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="h-4 bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-500"
                style={{ width: `${percentualConcluido}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CALENDÁRIO / HEATMAP */}
      {diasCalendario.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🗓️ Calendário de treinos</CardTitle>
            <CardDescription>Cada quadrado = 1 dia. Verde = treinou.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-14 gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(14px, 1fr))' }}>
              {diasCalendario.map((d, i) => {
                const cor = d.feita
                  ? 'bg-emerald-500'
                  : d.semanaIdx % 4 === 3
                  ? 'bg-amber-700/40'
                  : 'bg-muted';
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-sm ${cor}`}
                    title={`${d.data.toLocaleDateString('pt-BR')} · ${d.feita ? 'Treinou' : 'Descansou'}`}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span>Treinou</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-amber-700/40" />
                <span>Deload</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted" />
                <span>Descansou</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ADERÊNCIA POR SEMANA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📊 Aderência por semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: plano.duracaoSemanas }).map((_, i) => {
              const sessoesEsperadas = plano.sessoesPorSemana;
              const sessoesFeitasSemana = plano.sessoes
                .filter((s) => s.semanaIdx === i)
                .filter((s) => sessoesFeitasPlanoUnicas.some((sf) => sf.planoSessaoId === s.id)).length;
              const aderenciaSemana = Math.round((sessoesFeitasSemana / sessoesEsperadas) * 100);
              const isAtual = i === semanaAtual;
              const isDeloadSem = i % 4 === 3;
              return (
                <div key={i} className={`flex items-center gap-2 text-xs ${isAtual ? 'font-bold' : ''}`}>
                  <span className="w-12 text-right">S{i + 1}</span>
                  {isDeloadSem && <span className="text-amber-400 text-[10px]">🛌</span>}
                  <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-4 transition-all ${
                        aderenciaSemana >= 80 ? 'bg-emerald-500' :
                        aderenciaSemana >= 50 ? 'bg-amber-500' :
                        aderenciaSemana > 0 ? 'bg-rose-500' : 'bg-muted'
                      }`}
                      style={{ width: `${aderenciaSemana}%` }}
                    />
                  </div>
                  <span className="w-16 text-muted-foreground">{sessoesFeitasSemana}/{sessoesEsperadas}</span>
                  <span className="w-12 text-right">{aderenciaSemana}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* FEEDBACK */}
      {aderencia >= 80 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-emerald-400" />
            <div>
              <div className="font-bold text-emerald-300">Excelente aderência!</div>
              <div className="text-xs text-muted-foreground">
                Você está seguindo o plano direitinho. Continue assim!
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {aderencia < 50 && sessoesEsperadasAteHoje > 5 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-amber-400" />
            <div>
              <div className="font-bold text-amber-300">Aderência baixa</div>
              <div className="text-xs text-muted-foreground">
                Que tal reduzir a frequência ou duração para algo mais sustentável?
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {streak >= 7 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Flame className="h-8 w-8 text-amber-400" />
            <div>
              <div className="font-bold text-amber-300">Streak de {streak} dias! 🔥</div>
              <div className="text-xs text-muted-foreground">
                Você está pegando embalo. Não pare agora!
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
