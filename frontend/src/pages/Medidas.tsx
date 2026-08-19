import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safeGetDocs } from '@/lib/asyncUtils';
import { collection, query, orderBy,  deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Ruler, Trash2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

export function Medidas() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['medidas', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'medidas'),
        orderBy('data', 'desc'),
      );
      return safeGetDocs(q, 10000, 'collection');
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'medidas', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medidas', user?.uid] });
      toast.success('Medidas removidas');
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const medidas = data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medidas Corporais</h1>
          <p className="text-sm text-muted-foreground">
            Circunferências e composição corporal
          </p>
        </div>
        <Button asChild>
          <Link to="/app/medidas/nova"><Plus className="mr-2 h-4 w-4" />Nova medida</Link>
        </Button>
      </div>

      {medidas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="📏"
              titulo="Nenhuma medida registrada"
              descricao="Acompanhe circunferências e % de gordura. Para 50+, monitorar massa magra (sarcopenia) é tão importante quanto peso."
              acao={
                <Button asChild>
                  <Link to="/app/medidas/nova"><Plus className="mr-2 h-4 w-4" />Primeira medição</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {medidas.map((m: any) => (
            <Card key={m.id} className="hover:border-primary/30 transition group">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <Ruler className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">
                          {tsToDate(m.data)?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {m.observacoes || 'Sem observações'}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => del.mutate(m.id)}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                      {m.peito && <Mini label="Peito" value={`${m.peito}cm`} />}
                      {m.cintura && <Mini label="Cintura" value={`${m.cintura}cm`} />}
                      {m.quadril && <Mini label="Quadril" value={`${m.quadril}cm`} />}
                      {m.bracoDir && <Mini label="Braço Dir." value={`${m.bracoDir}cm`} />}
                      {m.coxaDir && <Mini label="Coxa Dir." value={`${m.coxaDir}cm`} />}
                      {m.panturrilhaDir && <Mini label="Panturrilha Dir." value={`${m.panturrilhaDir}cm`} />}
                      {m.gorduraPercent && <Mini label="Gordura" value={`${m.gorduraPercent.toFixed(1)}%`} />}
                      {m.massaMagra && <Mini label="Massa magra" value={`${m.massaMagra.toFixed(1)}kg`} />}
                    </div>
                  </div>
                  <Link to={`/app/medidas/${m.id}`} className="self-center text-muted-foreground hover:text-foreground">
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

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-2 py-1.5">
      <div className="text-muted-foreground text-[10px] uppercase tracking-wide">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
