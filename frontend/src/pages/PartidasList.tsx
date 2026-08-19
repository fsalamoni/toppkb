import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import * as LucideIcons from 'lucide-react';

const { Plus, Trash2, ChevronRight, TrendingUp, TrendingDown, Minus } = LucideIcons;
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

function tsToIso(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  if (ts.toDate) return ts.toDate().toISOString();
  return new Date(ts).toISOString();
}

const TIPO_LABELS: Record<string, string> = {
  amistosa: 'Amistosa',
  ranking: 'Ranking',
  torneio: 'Torneio',
  duplas: 'Duplas',
  simples: 'Simples',
  misto: 'Misto',
};

const _ICON_REF = [TrendingUp, TrendingDown, Minus] as const;
void _ICON_REF;

const RESULTADO_BADGE: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  vitoria: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', label: 'Vitória', icon: TrendingUp },
  derrota: { bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-300', label: 'Derrota', icon: TrendingDown },
  empate: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', label: 'Empate', icon: Minus },
};

export function PartidasList() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['partidas', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'partidas'),
        orderBy('data', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'partidas', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partidas', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Partida removida');
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

  const partidas = data || [];
  const vitorias = partidas.filter((p: any) => p.resultado === 'vitoria').length;
  const derrotas = partidas.filter((p: any) => p.resultado === 'derrota').length;
  const empates = partidas.filter((p: any) => p.resultado === 'empate').length;
  const winRate = partidas.length > 0 ? Math.round((vitorias / partidas.length) * 100) : 0;
  // Streak atual
  let streak = 0;
  let streakType: 'V' | 'D' | null = null;
  for (const p of partidas) {
    if (streak === 0) {
      if (p.resultado === 'vitoria') { streak = 1; streakType = 'V'; }
      else if (p.resultado === 'derrota') { streak = 1; streakType = 'D'; }
      else break;
    } else if (streakType === 'V' && p.resultado === 'vitoria') streak++;
    else if (streakType === 'D' && p.resultado === 'derrota') streak++;
    else break;
  }

  return (
    <div className="space-y-4">
      {/* Header com KPIs */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partidas</h1>
          <p className="text-sm text-muted-foreground">
            {partidas.length} {partidas.length === 1 ? 'partida registrada' : 'partidas registradas'}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/partidas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova partida
          </Link>
        </Button>
      </div>

      {partidas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="Vitórias" value={vitorias.toString()} color="emerald" />
          <KPI label="Derrotas" value={derrotas.toString()} color="red" />
          <KPI label="Empates" value={empates.toString()} color="amber" />
          <KPI label="Win rate" value={`${winRate}%`} color="primary" />
          {streak > 1 && streakType && (
            <div className={cn(
              "col-span-2 md:col-span-4 rounded-lg p-3 flex items-center gap-3",
              streakType === 'V' ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-red-500/10 border border-red-500/30"
            )}>
              {streakType === 'V' ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
              <div>
                <div className="font-semibold">
                  {streak} {streakType === 'V' ? 'vitórias' : 'derrotas'} seguidas
                </div>
                <div className="text-xs text-muted-foreground">Streak atual</div>
              </div>
            </div>
          )}
        </div>
      )}

      {partidas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="🎾"
              titulo="Nenhuma partida registrada"
              descricao="Registre suas partidas para acompanhar evolução, taxa de vitória, e análise de adversários."
              acao={
                <Button asChild>
                  <Link to="/app/partidas/nova">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar primeira partida
                  </Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {partidas.map((p: any) => {
            const resultado = RESULTADO_BADGE[p.resultado as string] || RESULTADO_BADGE.empate;
            const ResultadoIcon = resultado.icon;
            return (
              <Card key={p.id} className="hover:border-primary/30 transition group">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    {/* Badge de resultado */}
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0",
                      resultado.bg
                    )}>
                      <ResultadoIcon className={cn("h-6 w-6", resultado.text)} />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">
                            vs {p.adversario || 'Adversário'}
                            {p.adversarioNivel && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                · {p.adversarioNivel}
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(tsToIso(p.data))}
                            {p.local && ` · ${p.local}`}
                            {p.tipo && ` · ${TIPO_LABELS[p.tipo as string] || p.tipo}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-md font-medium",
                            resultado.bg, resultado.text
                          )}>
                            {resultado.label}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => del.mutate(p.id)}
                            className="opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>

                      {/* Placar */}
                      {p.placar && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="font-mono font-semibold">{p.placar}</span>
                          {p.sets && <span className="text-xs text-muted-foreground">({p.sets})</span>}
                        </div>
                      )}

                      {/* Métricas */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {p.duracaoMin && (
                          <div className="text-xs px-2 py-1 rounded-md bg-muted">
                            ⏱ {p.duracaoMin}min
                          </div>
                        )}
                        {p.winners !== undefined && (
                          <div className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            🏆 {p.winners} winners
                          </div>
                        )}
                        {p.unforcedErrors !== undefined && (
                          <div className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-700 dark:text-red-300">
                            ❌ {p.unforcedErrors} erros não forçados
                          </div>
                        )}
                        {p.ladoDominante && (
                          <div className="text-xs px-2 py-1 rounded-md bg-muted">
                            {p.ladoDominante === 'destro' ? '🤚 Destro' : p.ladoDominante === 'canhoto' ? '✋ Canhoto' : '🤚✋ Ambidestro'}
                          </div>
                        )}
                      </div>

                      {/* Pontos fortes / fracos */}
                      {(p.pontosFortes || p.pontosFracos) && (
                        <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {p.pontosFortes && <span>✅ <span className="text-emerald-700 dark:text-emerald-300">{p.pontosFortes}</span></span>}
                          {p.pontosFortes && p.pontosFracos && <span> · </span>}
                          {p.pontosFracos && <span>⚠️ <span className="text-red-700 dark:text-red-300">{p.pontosFracos}</span></span>}
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/app/partidas/${p.id}`}
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

function KPI({ label, value, color }: { label: string; value: string; color: 'emerald' | 'red' | 'amber' | 'primary' }) {
  const colors = {
    emerald: 'text-emerald-500',
    red: 'text-red-500',
    amber: 'text-amber-500',
    primary: 'text-primary',
  };
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 text-center">
      <div className={cn("text-2xl font-bold", colors[color])}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
