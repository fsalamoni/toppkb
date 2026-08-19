import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Trophy, Trash2, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { differenceInDays } from '@/lib/utils';
import { cn } from '@/lib/utils';

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

const STATUS_OPCOES: Record<string, { bg: string; text: string; label: string }> = {
  agendado: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-300', label: 'Agendado' },
  inscrito: { bg: 'bg-purple-500/10', text: 'text-purple-700 dark:text-purple-300', label: 'Inscrito' },
  'em-andamento': { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', label: 'Em andamento' },
  concluido: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', label: 'Concluído' },
  cancelado: { bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-300', label: 'Cancelado' },
};

export function Torneios() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['torneios', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'torneios'),
        orderBy('dataInicio', 'asc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'torneios', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneios', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Torneio removido');
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const torneios = data || [];
  const agora = new Date();
  const futuros = torneios.filter((t: any) => {
    const d = tsToDate(t.dataInicio);
    return d && d >= agora;
  });
  const proximo = futuros[0];
  const diasAteProximo = proximo ? differenceInDays(tsToDate(proximo.dataInicio)!, agora) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Torneios</h1>
          <p className="text-sm text-muted-foreground">
            {torneios.length} {torneios.length === 1 ? 'torneio' : 'torneios'} · {futuros.length} próximos
          </p>
        </div>
        <Button asChild>
          <Link to="/app/torneios/novo"><Plus className="mr-2 h-4 w-4" />Novo torneio</Link>
        </Button>
      </div>

      {proximo && diasAteProximo !== null && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-500" />
            <div className="flex-1">
              <div className="font-semibold">{proximo.nome}</div>
              <div className="text-xs text-muted-foreground">
                {diasAteProximo === 0 ? '🔥 HOJE' : diasAteProximo === 1 ? '🔥 AMANHÃ' : `Em ${diasAteProximo} dias`}
                {proximo.local && ` · ${proximo.local}`}
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to={`/app/torneios/${proximo.id}`}>Ver</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {torneios.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="🏆"
              titulo="Nenhum torneio agendado"
              descricao="Cadastre torneios futuros para se preparar fisicamente, planejar logística e acompanhar resultados."
              acao={
                <Button asChild>
                  <Link to="/app/torneios/novo"><Plus className="mr-2 h-4 w-4" />Cadastrar</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {torneios.map((t: any) => {
            const status = STATUS_OPCOES[t.status] || STATUS_OPCOES.agendado;
            const d = tsToDate(t.dataInicio);
            const df = tsToDate(t.dataFim);
            return (
              <Card key={t.id} className="hover:border-primary/30 transition group">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <Trophy className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{t.nome}</h3>
                          <p className="text-xs text-muted-foreground">
                            {d?.toLocaleDateString('pt-BR')}
                            {df && ` → ${df.toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs px-2 py-1 rounded-md font-medium", status.bg, status.text)}>
                            {status.label}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => del.mutate(t.id)}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded-md bg-muted">
                          {t.tipo} · {t.categoria} · {t.modalidade}
                        </span>
                        {(t.cidade || t.local) && (
                          <span className="text-xs px-2 py-1 rounded-md bg-muted">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            {[t.local, t.cidade, t.estado].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {t.colocacao && (
                          <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-700">
                            🏆 {t.colocacao}º lugar {t.resultadoFinal && `· ${t.resultadoFinal}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link to={`/app/torneios/${t.id}`} className="self-center text-muted-foreground hover:text-foreground">
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
