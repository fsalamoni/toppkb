import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safeGetDocs } from '@/lib/asyncUtils';
import { collection, query, orderBy,  deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Apple, Trash2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

const TIPO_OPCOES: Record<string, string> = {
  'cafe-da-manha': '☕ Café da manhã',
  'lanche-manha': '🍎 Lanche manhã',
  almoco: '🍽️ Almoço',
  'lanche-tarde': '🥪 Lanche tarde',
  jantar: '🌙 Jantar',
  ceia: '🌜 Ceia',
  'pre-treino': '🏓 Pré-treino',
  'pos-treino': '💪 Pós-treino',
};

export function Nutricao() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['nutricao', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'nutricao'),
        orderBy('data', 'desc'),
      );
      return safeGetDocs(q, 10000, 'collection');
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'nutricao', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutricao', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Refeição removida');
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const refeicoes = data || [];
  const totais = refeicoes.reduce((acc: any, r: any) => {
    const t = r.totais || { kcal: 0, proteina: 0, carboidrato: 0, gordura: 0 };
    return {
      kcal: acc.kcal + (t.kcal || 0),
      proteina: acc.proteina + (t.proteina || 0),
      carboidrato: acc.carboidrato + (t.carboidrato || 0),
      gordura: acc.gordura + (t.gordura || 0),
    };
  }, { kcal: 0, proteina: 0, carboidrato: 0, gordura: 0 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nutrição</h1>
          <p className="text-sm text-muted-foreground">
            {refeicoes.length} {refeicoes.length === 1 ? 'refeição registrada' : 'refeições registradas'}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/nutricao/nova"><Plus className="mr-2 h-4 w-4" />Nova refeição</Link>
        </Button>
      </div>

      {refeicoes.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {Math.round(totais.kcal)}
                </div>
                <div className="text-xs text-muted-foreground">kcal</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {totais.proteina.toFixed(0)}g
                </div>
                <div className="text-xs text-muted-foreground">Proteína</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {totais.carboidrato.toFixed(0)}g
                </div>
                <div className="text-xs text-muted-foreground">Carb</div>
              </div>
              <div>
                <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {totais.gordura.toFixed(0)}g
                </div>
                <div className="text-xs text-muted-foreground">Gord</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {refeicoes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="🥗"
              titulo="Nenhuma refeição registrada"
              descricao="Use o banco com 50+ alimentos brasileiros para tracking preciso de macros e calorias."
              acao={
                <Button asChild>
                  <Link to="/app/nutricao/nova"><Plus className="mr-2 h-4 w-4" />Primeira refeição</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {refeicoes.map((r: any) => {
            const t = r.totais || { kcal: 0, proteina: 0, carboidrato: 0, gordura: 0 };
            return (
              <Card key={r.id} className="hover:border-primary/30 transition group">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <Apple className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">
                            {TIPO_OPCOES[r.tipo] || r.tipo}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {tsToDate(r.data)?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {r.horario && ` · ${r.horario}`}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => del.mutate(r.id)}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-700 font-semibold">
                          🔥 {Math.round(t.kcal)} kcal
                        </span>
                        <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-700">
                          P {t.proteina?.toFixed(0)}g
                        </span>
                        <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-700">
                          C {t.carboidrato?.toFixed(0)}g
                        </span>
                        <span className="px-2 py-1 rounded-md bg-rose-500/10 text-rose-700">
                          G {t.gordura?.toFixed(0)}g
                        </span>
                        <span className="px-2 py-1 rounded-md bg-muted">
                          {r.alimentos?.length || 0} alimentos
                        </span>
                      </div>
                    </div>
                    <Link to={`/app/nutricao/${r.id}`} className="self-center text-muted-foreground hover:text-foreground">
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
