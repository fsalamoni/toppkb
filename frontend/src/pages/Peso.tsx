import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safeGetDocs } from '@/lib/asyncUtils';
import { collection, query, orderBy,  deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Trash2, ChevronRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

export function Peso() {
  const { user } = useAuth();
  const userDoc = useAuthStore((s) => s.userDoc);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['peso', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'peso'),
        orderBy('data', 'desc'),
      );
      return safeGetDocs(q, 10000, 'collection');
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'peso', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peso', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Pesagem removida');
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const pesos = data || [];
  const pesoAtual = pesos[0]?.peso;
  const pesoAnterior = pesos[1]?.peso;
  const variacao = pesoAtual && pesoAnterior ? (pesoAtual - pesoAnterior) : 0;
  const pesoMeta = userDoc?.pesoMeta;
  const diffMeta = pesoAtual && pesoMeta ? (pesoAtual - pesoMeta) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Peso</h1>
          <p className="text-sm text-muted-foreground">{pesos.length} pesagens</p>
        </div>
        <Button asChild>
          <Link to="/app/peso/nova"><Plus className="mr-2 h-4 w-4" />Nova pesagem</Link>
        </Button>
      </div>

      {pesoAtual && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                  {pesoAtual.toFixed(1)}<span className="text-base text-muted-foreground"> kg</span>
                </div>
                <div className="text-xs text-muted-foreground">Atual</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {variacao > 0 ? <TrendingUp className="inline h-5 w-5 text-red-500" /> :
                   variacao < 0 ? <TrendingDown className="inline h-5 w-5 text-emerald-500" /> :
                   <Minus className="inline h-5 w-5 text-slate-500" />}
                  {Math.abs(variacao).toFixed(1)} kg
                </div>
                <div className="text-xs text-muted-foreground">vs anterior</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${diffMeta && Math.abs(diffMeta) < 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {pesoMeta ? `${diffMeta?.toFixed(1)} kg` : '—'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {pesoMeta ? `da meta (${pesoMeta}kg)` : 'Defina meta'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pesos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="⚖️"
              titulo="Nenhuma pesagem"
              descricao="Registre seu peso regularmente. Para 50+, manter peso saudável é chave para performance e saúde metabólica."
              acao={
                <Button asChild>
                  <Link to="/app/peso/nova"><Plus className="mr-2 h-4 w-4" />Primeira pesagem</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {pesos.map((p: any) => (
            <Card key={p.id} className="hover:border-primary/30 transition group">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl flex-shrink-0">⚖️</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {p.peso.toFixed(1)} kg
                          {p.gorduraPercent && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              · {p.gorduraPercent.toFixed(1)}% gordura
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {tsToDate(p.data)?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => del.mutate(p.id)}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <Link to={`/app/peso/${p.id}`} className="text-muted-foreground hover:text-foreground">
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
