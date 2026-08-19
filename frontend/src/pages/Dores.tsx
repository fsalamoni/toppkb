import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, AlertCircle, Trash2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

export function Dores() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['dores', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'dores'),
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
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'dores', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dores', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Dor removida');
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const dores = data || [];
  const ativas = dores.filter((d: any) => d.ativa !== false).length;
  const intensas = dores.filter((d: any) => (d.intensidade || 0) >= 7).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dores</h1>
          <p className="text-sm text-muted-foreground">
            {dores.length} {dores.length === 1 ? 'registro' : 'registros'}
            {ativas > 0 && <span className="ml-2 text-amber-600 font-semibold">· {ativas} ativas</span>}
            {intensas > 0 && <span className="ml-2 text-red-600 font-semibold">· {intensas} intensas (≥7)</span>}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/dores/nova"><Plus className="mr-2 h-4 w-4" />Registrar dor</Link>
        </Button>
      </div>

      {dores.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="💪"
              titulo="Nenhuma dor registrada"
              descricao="Registre dores para acompanhar intensidade, evolução e prevenir que vire lesão crônica."
              acao={
                <Button asChild>
                  <Link to="/app/dores/nova"><Plus className="mr-2 h-4 w-4" />Registrar</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {dores.map((d: any) => {
            const int = d.intensidade || 0;
            const cor = int >= 7 ? 'red' : int >= 4 ? 'amber' : 'emerald';
            const corMap: any = { red: 'border-l-red-500', amber: 'border-l-amber-500', emerald: 'border-l-emerald-500' };
            return (
              <Card key={d.id} className={cn('hover:border-primary/30 transition group border-l-4', corMap[cor])}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className={cn("h-5 w-5 flex-shrink-0 mt-0.5",
                      int >= 7 ? 'text-red-500' : int >= 4 ? 'text-amber-500' : 'text-emerald-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">
                            {d.regiao?.replace(/-/g, ' ')}
                            {d.ativa === false && (
                              <span className="ml-2 text-xs text-emerald-600 font-normal">✅ resolvida</span>
                            )}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {tsToDate(d.data)?.toLocaleDateString('pt-BR')}
                            {' · '}{d.tipo}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-bold tabular-nums",
                            cor === 'red' ? 'text-red-600' : cor === 'amber' ? 'text-amber-600' : 'text-emerald-600'
                          )}>
                            {int}/10
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => del.mutate(d.id)}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      {d.observacoes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          "{d.observacoes}"
                        </p>
                      )}
                    </div>
                    <Link to={`/app/dores/${d.id}`} className="self-center text-muted-foreground hover:text-foreground">
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
