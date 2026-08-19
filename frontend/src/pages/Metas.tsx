import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safeGetDocs } from '@/lib/asyncUtils';
import { collection, query, orderBy,  deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

const CATEGORIA_LABELS: Record<string, { icone: string; cor: string }> = {
  tecnica: { icone: '🎯', cor: 'emerald' },
  fisica: { icone: '💪', cor: 'blue' },
  tatica: { icone: '🧠', cor: 'purple' },
  mental: { icone: '💭', cor: 'violet' },
  competitiva: { icone: '🏆', cor: 'amber' },
  'estilo-vida': { icone: '🌱', cor: 'green' },
  carreira: { icone: '📈', cor: 'rose' },
};

const STATUS_OPCOES: Record<string, { bg: string; text: string; label: string }> = {
  ativa: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', label: '🟢 Ativa' },
  concluida: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-300', label: '✅ Concluída' },
  abandonada: { bg: 'bg-slate-500/10', text: 'text-slate-700', label: '⚫ Abandonada' },
};

export function Metas() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['metas', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'metas'),
        orderBy('prazo', 'asc'),
      );
      return safeGetDocs(q, 10000, 'collection');
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'metas', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metas', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Meta removida');
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const metas = data || [];
  const ativas = metas.filter((m: any) => m.status === 'ativa').length;
  const concluidas = metas.filter((m: any) => m.status === 'concluida').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
          <p className="text-sm text-muted-foreground">
            {metas.length} {metas.length === 1 ? 'meta' : 'metas'} · {ativas} ativas · {concluidas} concluídas
          </p>
        </div>
        <Button asChild>
          <Link to="/app/metas/nova"><Plus className="mr-2 h-4 w-4" />Nova meta</Link>
        </Button>
      </div>

      {metas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="🎯"
              titulo="Nenhuma meta definida"
              descricao="Defina metas SMART (específicas, mensuráveis, com prazo). Ter clareza de onde você quer chegar é o primeiro passo."
              acao={
                <Button asChild>
                  <Link to="/app/metas/nova"><Plus className="mr-2 h-4 w-4" />Criar primeira meta</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {metas.map((m: any) => {
            const cat = CATEGORIA_LABELS[m.categoria] || CATEGORIA_LABELS.competitiva;
            const status = STATUS_OPCOES[m.status] || STATUS_OPCOES.ativa;
            const progresso = m.progresso || 0;
            return (
              <Card key={m.id} className="hover:border-primary/30 transition group">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{cat.icone}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{m.titulo}</h3>
                          <p className="text-xs text-muted-foreground">
                            {m.prazo && `Prazo: ${tsToDate(m.prazo)?.toLocaleDateString('pt-BR')}`}
                            {m.prazoMeses && ` (${m.prazoMeses} meses)`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs px-2 py-1 rounded-md font-medium", status.bg, status.text)}>
                            {status.label}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => del.mutate(m.id)}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      {m.descricao && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {m.descricao}
                        </p>
                      )}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-semibold">{progresso}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all"
                            style={{ width: `${progresso}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Link to={`/app/metas/${m.id}`} className="self-center text-muted-foreground hover:text-foreground">
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
