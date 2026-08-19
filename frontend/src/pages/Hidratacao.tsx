import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, deleteDoc, doc, where, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Droplets, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

export function Hidratacao() {
  const { user, userDoc } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['hidratacao', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'hidratacao'),
        orderBy('data', 'desc'),
        limit(60),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const { data: registroHoje } = useQuery({
    queryKey: ['hidratacao-hoje', user?.uid, new Date().toISOString().slice(0, 10)],
    queryFn: async () => {
      if (!user) return null;
      const dataKey = new Date().toISOString().slice(0, 10);
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'hidratacao'),
        where('data', '==', dataKey),
        limit(1),
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'hidratacao', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hidratacao', user?.uid] });
      qc.invalidateQueries({ queryKey: ['hidratacao-hoje', user?.uid] });
      toast.success('Registro removido');
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const registros = data || [];
  const totalMl = registroHoje?.totalMl || 0;
  const peso = userDoc?.pesoInicial || 80;
  const metaMl = Math.round(peso * 35);
  const progresso = Math.min(100, Math.round((totalMl / metaMl) * 100));

  const corBarra = progresso >= 100 ? 'emerald' : progresso >= 70 ? 'blue' : progresso >= 40 ? 'amber' : 'red';

  const mediaMl = registros.length > 0
    ? registros.reduce((acc: number, r: any) => acc + (r.totalMl || 0), 0) / registros.length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hidratação</h1>
          <p className="text-sm text-muted-foreground">
            {registros.length} {registros.length === 1 ? 'dia registrado' : 'dias registrados'} · meta: {metaMl}ml/dia
          </p>
        </div>
        <Button asChild>
          <Link to="/app/hidratacao/nova">
            <Plus className="mr-2 h-4 w-4" />
            {registroHoje ? 'Atualizar hoje' : 'Registrar hoje'}
          </Link>
        </Button>
      </div>

      {/* Card de hoje */}
      <Card className={cn(
        "border-2",
        progresso >= 100 ? 'border-emerald-500/50 bg-emerald-500/5' :
        progresso < 50 ? 'border-red-500/50 bg-red-500/5' : ''
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-cyan-500" />
              <span className="font-semibold">Hoje</span>
            </div>
            <span className={cn(
              "text-2xl font-bold",
              corBarra === 'emerald' ? 'text-emerald-600' :
              corBarra === 'blue' ? 'text-blue-600' :
              corBarra === 'amber' ? 'text-amber-600' : 'text-red-600'
            )}>
              {totalMl}ml
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                corBarra === 'emerald' ? 'bg-emerald-500' :
                corBarra === 'blue' ? 'bg-blue-500' :
                corBarra === 'amber' ? 'bg-amber-500' : 'bg-red-500'
              )}
              style={{ width: `${progresso}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>
              {progresso >= 100 ? '🎉 Meta atingida!' :
               progresso >= 70 ? '👍 Quase lá' :
               progresso >= 40 ? '⚠️ Beba mais água' :
               '❗ Hidratação crítica'}
            </span>
            <span>{metaMl - totalMl > 0 ? `Faltam ${metaMl - totalMl}ml` : '✓ Completo'}</span>
          </div>
        </CardContent>
      </Card>

      {registros.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-card p-3 text-center">
            <div className="text-2xl font-bold text-cyan-500">{Math.round(mediaMl)}ml</div>
            <div className="text-xs text-muted-foreground">Média diária</div>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <div className="text-2xl font-bold text-emerald-500">
              {registros.filter((r: any) => r.totalMl >= metaMl).length}
            </div>
            <div className="text-xs text-muted-foreground">Dias dentro da meta</div>
          </div>
        </div>
      )}

      {registros.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="💧"
              titulo="Nenhum registro de hidratação"
              descricao="Para 50+, manter boa hidratação é crítico. Meta: ~35ml por kg de peso corporal por dia."
              acao={
                <Button asChild>
                  <Link to="/app/hidratacao/nova"><Plus className="mr-2 h-4 w-4" />Registrar hoje</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {registros.map((r: any) => {
            const prog = Math.min(100, Math.round((r.totalMl / metaMl) * 100));
            return (
              <Card key={r.id} className="hover:border-primary/30 transition group">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center gap-3">
                    <Droplets className={cn(
                      "h-5 w-5 flex-shrink-0",
                      prog >= 100 ? 'text-emerald-500' : prog >= 50 ? 'text-cyan-500' : 'text-amber-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-sm">
                            {tsToDate(r.data)?.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {r.totalMl}ml · {prog}% da meta
                            {r.coposPequenos > 0 && ` · ${r.coposPequenos}P`}
                            {r.coposMedios > 0 && `+${r.coposMedios}M`}
                            {r.coposGrandes > 0 && `+${r.coposGrandes}G`}
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
                    </div>
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
