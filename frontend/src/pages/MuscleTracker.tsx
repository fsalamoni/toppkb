/**
 * MuscleTracker — Dashboard de músculos trabalhados nos últimos dias.
 * Mostra frequência muscular + músculos negligenciados + recomendações.
 */
import * as LucideIcons from 'lucide-react';
const {
  Activity, Dumbbell, Calendar, Flame, Trophy, AlertCircle,
} = LucideIcons;

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common/LoadingScreen';
import { analyzeMuscleFrequency, findNeglectedMuscles, recommendExercisesForMuscle } from '@/lib/muscle-tracker';
import { ExerciseBadge } from '@/components/common/ExerciseBadge';

export default function MuscleTracker() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Buscar sessões de preparação do usuário
  const { data: sessoes, isLoading } = useQuery({
    queryKey: ['preparacao', user?.uid, 'for-muscle-tracker'],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'preparacao'),
        orderBy('data', 'desc'),
        limit(50),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        data: d.data().data,
        exercicios: d.data().exercicios ?? [],
      }));
    },
    enabled: !!user?.uid,
    staleTime: 60_000,
  });

  // Analisar músculos
  const analytics = useMemo(() => {
    if (!sessoes) return { grupos: [], totalSessoes: 0 };
    return analyzeMuscleFrequency(sessoes, { diasAtras: 30 });
  }, [sessoes]);

  const neglected = useMemo(() => {
    if (!sessoes) return [];
    return findNeglectedMuscles(sessoes, { diasSemAtividade: 5 });
  }, [sessoes]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-muted-foreground">
        Faça login para ver seu histórico de músculos trabalhados.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-400" />
            Músculos Trabalhados
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe quais músculos você tem trabalhado nos últimos 30 dias
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : analytics.totalSessoes === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Você ainda não registrou nenhuma sessão com exercícios.
            </p>
            <Button
              onClick={() => navigate('/app/preparacao/nova')}
              className="mt-4"
            >
              Criar primeira sessão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* RESUMO */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              icon={<Calendar className="h-5 w-5" />}
              label="Sessões analisadas"
              value={analytics.totalSessoes.toString()}
            />
            <SummaryCard
              icon={<Activity className="h-5 w-5" />}
              label="Músculos trabalhados"
              value={analytics.grupos.length.toString()}
              color="emerald"
            />
            <SummaryCard
              icon={<Flame className="h-5 w-5" />}
              label="Mais frequente"
              value={analytics.grupos[0]?.muscle.split('—')[0].trim() ?? '—'}
              color="orange"
            />
            <SummaryCard
              icon={<AlertCircle className="h-5 w-5" />}
              label="Negligenciados"
              value={neglected.length.toString()}
              color={neglected.length > 0 ? 'amber' : 'muted'}
            />
          </div>

          {/* FREQUÊNCIA MUSCULAR (TOP 12) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Frequência Muscular (últimos 30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.grupos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Sem dados de músculos ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {analytics.grupos.slice(0, 12).map((g, i) => {
                    const maxCount = analytics.grupos[0]?.count ?? 1;
                    const pct = (g.count / maxCount) * 100;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium capitalize">{g.muscle}</span>
                          <span className="text-muted-foreground">
                            {g.count} {g.count === 1 ? 'vez' : 'vezes'}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* MÚSCULOS NEGLIGENCIADOS + RECOMENDAÇÕES */}
          {neglected.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  Músculos negligenciados ({neglected.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Estes músculos não foram trabalhados há 5+ dias. Considere incluí-los em sua próxima sessão.
                </p>
                {neglected.slice(0, 6).map((m, i) => {
                  const recs = recommendExercisesForMuscle(m.muscle, 3);
                  return (
                    <div key={i} className="border-l-2 border-amber-500/30 pl-3 py-1">
                      <div className="font-semibold text-sm capitalize mb-2">
                        ⚠ {m.muscle}
                        {m.lastDate && (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            (última vez: {new Date(m.lastDate).toLocaleDateString('pt-BR')})
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recs.map((ex) => (
                          <ExerciseBadge
                            key={ex.id}
                            id={ex.id}
                            variant="compact"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* TOP EXERCÍCIOS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                Top Exercícios Mais Usados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(
                  analytics.grupos.reduce<Record<string, { count: number; muscle: string }>>(
                    (acc, g) => {
                      g.exercises.forEach((exName) => {
                        if (!acc[exName]) acc[exName] = { count: 0, muscle: g.muscle };
                        acc[exName].count++;
                      });
                      return acc;
                    },
                    {},
                  ),
                )
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 8)
                  .map(([exName, info], i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <span>{exName}</span>
                      <span className="text-xs text-muted-foreground">
                        {info.count}× · {info.muscle}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon, label, value, color = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: 'emerald' | 'orange' | 'amber' | 'blue' | 'muted';
}) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    muted: 'text-muted-foreground bg-muted',
  };
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${colorMap[color]}`}>{icon}</div>
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="mt-2 text-xl font-bold capitalize truncate">{value}</div>
    </div>
  );
}
