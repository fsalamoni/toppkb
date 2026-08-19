import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safeGetDocs } from '@/lib/asyncUtils';
import { collection, query, orderBy,  deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Trash2, ChevronRight, Clock } from 'lucide-react';

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

const TIPO_ICONE: Record<string, string> = {
  forca: '🏋️',
  mobilidade: '🤸',
  cardio: '❤️',
  core: '🧱',
  aquecimento: '🔥',
  alongamento: '🧘',
  misto: '⚡',
};

const TIPO_LABELS: Record<string, string> = {
  forca: 'Força',
  mobilidade: 'Mobilidade',
  cardio: 'Cardio',
  core: 'Core',
  aquecimento: 'Aquecimento',
  alongamento: 'Alongamento',
  misto: 'Misto',
};

export function PreparacaoList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filtroTipo, setFiltroTipo] = useState<string>('todas');

  const { data, isLoading } = useQuery({
    queryKey: ['preparacao', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'preparacao'),
        orderBy('data', 'desc'),
      );
      return safeGetDocs(q, 10000, 'collection');
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'preparacao', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['preparacao', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Sessão removida');
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const sessoes = (data || []).filter((s: any) =>
    filtroTipo === 'todas' || s.tipo === filtroTipo
  );

  // Stats
  const totalSessoes = data?.length || 0;
  const totalMin = (data || []).reduce((acc: number, s: any) => acc + (s.duracaoMin || 0), 0);
  const rpeMedio = (() => {
    const comRpe = (data || []).filter((s: any) => s.rpeMedio);
    if (comRpe.length === 0) return 0;
    return comRpe.reduce((acc: number, s: any) => acc + s.rpeMedio, 0) / comRpe.length;
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Preparação Física</h1>
          <p className="text-sm text-muted-foreground">
            Força, mobilidade, cardio, core — sessões registradas
          </p>
        </div>
        <Button asChild>
          <Link to="/app/preparacao/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova sessão
          </Link>
        </Button>
      </div>

      {totalSessoes > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <KPI label="Total de sessões" value={totalSessoes.toString()} />
          <KPI label="Tempo total" value={`${Math.round(totalMin / 60)}h`} />
          <KPI label="RPE médio" value={rpeMedio > 0 ? rpeMedio.toFixed(1) : '—'} />
        </div>
      )}

      {/* Filtro por tipo */}
      <div className="flex flex-wrap gap-1.5">
        {['todas', 'forca', 'cardio', 'mobilidade', 'core', 'alongamento', 'misto'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFiltroTipo(t)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              filtroTipo === t
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {t === 'todas' ? 'Todas' : TIPO_LABELS[t] || t}
          </button>
        ))}
      </div>

      {sessoes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="💪"
              titulo="Nenhuma sessão registrada"
              descricao="Registre suas sessões de força, mobilidade, cardio, core. Construa histórico para acompanhar evolução."
              acao={
                <Button asChild>
                  <Link to="/app/preparacao/nova">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar sessão
                  </Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sessoes.map((s: any) => (
            <Card key={s.id} className="hover:border-primary/30 transition group">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">
                    {TIPO_ICONE[s.tipo] || '💪'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">
                          {TIPO_LABELS[s.tipo] || s.tipo}
                          {s.divisao && (
                            <span className="ml-2 text-sm text-muted-foreground">
                              · {s.divisao}
                            </span>
                          )}
                          {s.foco && (
                            <span className="ml-2 text-sm text-muted-foreground">
                              · {s.foco}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {tsToDate(s.data)?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => del.mutate(s.id)}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {s.duracaoMin && (
                        <div className="text-xs px-2 py-1 rounded-md bg-muted">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {s.duracaoMin}min
                        </div>
                      )}
                      {s.rpeMedio && (
                        <div className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          RPE {s.rpeMedio}/10
                        </div>
                      )}
                      {s.intensidadeMedia && (
                        <div className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-700 dark:text-red-300">
                          ❤️ {s.intensidadeMedia} bpm
                        </div>
                      )}
                    </div>

                    {s.exercicios && s.exercicios.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.exercicios.slice(0, 5).map((e: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                            {e}
                          </span>
                        ))}
                        {s.exercicios.length > 5 && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                            +{s.exercicios.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    {s.observacoes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                        "{s.observacoes}"
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/app/preparacao/${s.id}`}
                    className="self-center text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 text-center">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
