import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Pill, Trash2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

const HORARIO_BADGE: Record<string, { icone: string; bg: string; text: string; label: string }> = {
  'cafe': { icone: '☕', bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', label: 'Café' },
  'almoco': { icone: '🍽️', bg: 'bg-orange-500/10', text: 'text-orange-700 dark:text-orange-300', label: 'Almoço' },
  'jantar': { icone: '🌙', bg: 'bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-300', label: 'Jantar' },
  'pre-treino': { icone: '🏓', bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-300', label: 'Pré-treino' },
  'pos-treino': { icone: '💪', bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-300', label: 'Pós-treino' },
  'ao-deitar': { icone: '😴', bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-300', label: 'Ao deitar' },
  'outro': { icone: '⏰', bg: 'bg-slate-500/10', text: 'text-slate-700', label: 'Outro' },
};

const FREQUENCIA_BADGE: Record<string, { label: string; cor: string }> = {
  diario: { label: '📅 Diário', cor: 'blue' },
  semanal: { label: '🗓 Semanal', cor: 'purple' },
  ciclico: { label: '🔄 Cíclico', cor: 'amber' },
  eventual: { label: '🎯 Eventual', cor: 'slate' },
};

export function Suplementos() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['suplementos', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'suplementos'),
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
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'suplementos', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suplementos', user?.uid] });
      toast.success('Suplemento removido');
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const suplementos = data || [];
  const totalDoses = suplementos.length;
  const diarios = suplementos.filter((s: any) => s.frequencia === 'diario').length;
  const efeitoMedio = suplementos.length > 0
    ? suplementos.reduce((acc: number, s: any) => acc + (s.efeitoPercebido || 0), 0) / suplementos.length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suplementos</h1>
          <p className="text-sm text-muted-foreground">
            {totalDoses} {totalDoses === 1 ? 'registro' : 'registros'} · {diarios} diários
          </p>
        </div>
        <Button asChild>
          <Link to="/app/suplementos/novo"><Plus className="mr-2 h-4 w-4" />Novo suplemento</Link>
        </Button>
      </div>

      {suplementos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-3 text-center">
            <div className="text-2xl font-bold text-purple-500">{totalDoses}</div>
            <div className="text-xs text-muted-foreground">Total de registros</div>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{diarios}</div>
            <div className="text-xs text-muted-foreground">Uso diário</div>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <div className="text-2xl font-bold text-amber-500">{efeitoMedio.toFixed(1)}/10</div>
            <div className="text-xs text-muted-foreground">Efeito médio</div>
          </div>
        </div>
      )}

      {suplementos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="💊"
              titulo="Nenhum suplemento registrado"
              descricao="Controle sua suplementação. Para 50+, alguns suplementos têm absorção reduzida com a idade e merecem atenção especial."
              acao={
                <Button asChild>
                  <Link to="/app/suplementos/novo"><Plus className="mr-2 h-4 w-4" />Registrar primeiro</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {suplementos.map((s: any) => {
            const horario = HORARIO_BADGE[s.horario] || HORARIO_BADGE.outro;
            const freq = FREQUENCIA_BADGE[s.frequencia] || FREQUENCIA_BADGE.eventual;
            return (
              <Card key={s.id} className="hover:border-primary/30 transition group">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <Pill className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold capitalize">{s.nome}</h3>
                          <p className="text-xs text-muted-foreground">
                            {s.dose}{s.unidade} · {tsToDate(s.data)?.toLocaleDateString('pt-BR')}
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
                        <span className={cn("text-xs px-2 py-1 rounded-md font-medium", horario.bg, horario.text)}>
                          {horario.icone} {horario.label}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-md bg-muted">
                          {freq.label}
                        </span>
                        {s.comAlimento && (
                          <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-700">
                            🍽️ Com alimento
                          </span>
                        )}
                        {s.efeitoPercebido && (
                          <span className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-700">
                            ⭐ {s.efeitoPercebido}/10
                          </span>
                        )}
                      </div>
                      {s.observacoes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          "{s.observacoes}"
                        </p>
                      )}
                    </div>
                    <Link to={`/app/suplementos/${s.id}`} className="self-center text-muted-foreground hover:text-foreground">
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
