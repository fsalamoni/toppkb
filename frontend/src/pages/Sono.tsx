import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

export function Sono() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sono', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'sono'),
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
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'sono', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sono', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Sono removido');
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const registros = data || [];
  const sonoMedio = registros.length > 0
    ? registros.reduce((acc: number, r: any) => acc + (r.horasDormidas || 0), 0) / registros.length
    : 0;
  const qualMedia = registros.length > 0
    ? registros.reduce((acc: number, r: any) => acc + (r.qualidade || 0), 0) / registros.length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sono</h1>
          <p className="text-sm text-muted-foreground">
            {registros.length} {registros.length === 1 ? 'noite registrada' : 'noites registradas'}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/sono/nova"><Plus className="mr-2 h-4 w-4" />Registrar sono</Link>
        </Button>
      </div>

      {registros.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-card p-3 text-center">
            <div className="text-2xl font-bold text-indigo-500">{sonoMedio.toFixed(1)}h</div>
            <div className="text-xs text-muted-foreground">Média de horas</div>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <div className="text-2xl font-bold text-amber-500">{qualMedia.toFixed(1)}/5</div>
            <div className="text-xs text-muted-foreground">Qualidade média</div>
          </div>
        </div>
      )}

      {registros.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="😴"
              titulo="Nenhum registro de sono"
              descricao="Sono é fundamental para performance e recuperação. Para 50+, ideal é 7-9 horas por noite."
              acao={
                <Button asChild>
                  <Link to="/app/sono/nova"><Plus className="mr-2 h-4 w-4" />Registrar</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {registros.map((r: any) => (
            <Card key={r.id} className="hover:border-primary/30 transition group">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">
                    {r.qualidade === 1 ? '😩' : r.qualidade === 2 ? '😪' : r.qualidade === 3 ? '😐' : r.qualidade === 4 ? '😊' : '🤩'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">
                          {tsToDate(r.data)?.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {r.horaDormir} → {r.horaAcordar} · {r.horasDormidas}h
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
                    {r.fatores && r.fatores.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.fatores.map((f: string) => (
                          <span key={f} className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link to={`/app/sono/${r.id}`} className="self-center text-muted-foreground hover:text-foreground">
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
