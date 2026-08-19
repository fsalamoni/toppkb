import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Trash2, MapPin, Users, Zap, Clock, ChevronRight } from 'lucide-react';
import { formatDateTime, formatDuration } from '@/lib/utils';
import type { Treino } from '@/lib/types';

const INTENSIDADE_CORES: Record<number, string> = {
  1: 'bg-slate-500',
  2: 'bg-blue-500',
  3: 'bg-cyan-500',
  4: 'bg-emerald-500',
  5: 'bg-lime-500',
  6: 'bg-yellow-500',
  7: 'bg-orange-500',
  8: 'bg-red-500',
  9: 'bg-red-600',
  10: 'bg-rose-700',
};

const TIPO_LABELS: Record<string, string> = {
  tecnico: '🏓 Técnico',
  tatica: '🎯 Tático',
  fisico: '💪 Físico',
  mental: '🧠 Mental',
  recreativo: '🎉 Recreativo',
  competitivo: '🏆 Competitivo',
};

function tsToIso(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  if (ts.toDate) return ts.toDate().toISOString();
  return new Date(ts).toISOString();
}

export function TreinosList() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['treinos', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'treinos'),
        orderBy('data', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Treino));
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'treinos', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['treinos', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Treino removido');
    },
    onError: (e: any) => toast.error('Erro: ' + e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const treinos = data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Treinos</h1>
          <p className="text-sm text-muted-foreground">
            {treinos.length} {treinos.length === 1 ? 'sessão registrada' : 'sessões registradas'}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/treinos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo treino
          </Link>
        </Button>
      </div>

      {treinos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="🏓"
              titulo="Nenhum treino registrado ainda"
              descricao="Comece registrando sua primeira sessão de treino. Você pode incluir drills, intensidade, duração e observações."
              acao={
                <Button asChild>
                  <Link to="/app/treinos/novo">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar primeiro treino
                  </Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {treinos.map((t) => {
            const intensidade = t.intensidade || t.rpe || 0;
            const corIntensidade = INTENSIDADE_CORES[intensidade] || 'bg-gray-500';
            const duracao = t.duracaoMin || 0;
            const drills = t.drillsRealizados || [];

            return (
              <Card key={t.id} className="hover:border-primary/30 transition group">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    {/* Intensidade (vertical bar) */}
                    <div className="flex flex-col items-center gap-1 min-w-[40px]">
                      <div className={`h-12 w-2 rounded-full ${corIntensidade}`} />
                      <span className="text-xs font-semibold">{intensidade}/10</span>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">
                            {TIPO_LABELS[t.tipo as string] || t.tipo}
                            {t.categoria && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                · {t.categoria}
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDateTime(tsToIso(t.data))}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => del.mutate(t.id as string)}
                          className="opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      {/* Métricas */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {duracao > 0 && (
                          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted">
                            <Clock className="h-3 w-3" />
                            {formatDuration(duracao)}
                          </div>
                        )}
                        {t.local && (
                          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted">
                            <MapPin className="h-3 w-3" />
                            {t.local}
                          </div>
                        )}
                        {t.parceiros && t.parceiros.length > 0 && (
                          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted">
                            <Users className="h-3 w-3" />
                            {t.parceiros.length}
                          </div>
                        )}
                        {t.energia && (
                          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted">
                            <Zap className="h-3 w-3" />
                            Energia: {t.energia}/10
                          </div>
                        )}
                      </div>

                      {/* Drills */}
                      {drills.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {drills.slice(0, 5).map((d: string) => (
                              <span
                                key={d}
                                className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              >
                                {d}
                              </span>
                            ))}
                            {drills.length > 5 && (
                              <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                                +{drills.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Observação */}
                      {t.observacoes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                          "{t.observacoes}"
                        </p>
                      )}
                    </div>

                    <Link
                      to={`/app/treinos/${t.id}`}
                      className="self-center text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
