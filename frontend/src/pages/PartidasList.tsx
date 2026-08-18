import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { Plus, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function PartidasList() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['/app/partidas', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'users', user.uid, '/app/partidas'), orderBy('data', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const vitorias = data?.filter((p: any) => p.resultado === 'vitoria').length || 0;
  const total = data?.length || 0;
  const winRate = total > 0 ? ((vitorias / total) * 100).toFixed(0) : '0';

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🎾 Partidas</h1>
        <Button asChild><Link to="/app/partidas/nova"><Plus className="h-4 w-4" /> Nova partida</Link></Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Total</div><div className="text-2xl font-bold">{total}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Vitórias</div><div className="text-2xl font-bold text-green-500">{vitorias}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Win rate</div><div className="text-2xl font-bold">{winRate}%</div></CardContent></Card>
      </div>

      {data && data.length === 0 ? (
        <EmptyState icone="🎾" titulo="Nenhuma partida registrada" descricao="Registre sua primeira partida!" acao={<Button asChild><Link to="/app/partidas/nova">Registrar partida</Link></Button>} />
      ) : (
        <div className="space-y-2">
          {data?.map((p: any) => (
            <Card key={p.id} className={cn(p.resultado === 'vitoria' ? 'border-green-500/30' : 'border-red-500/30')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Trophy className={cn('h-4 w-4', p.resultado === 'vitoria' ? 'text-green-500' : 'text-red-500')} />
                      <span className="font-medium capitalize">{p.resultado}</span>
                      <span className="text-sm text-muted-foreground">vs {p.adversarios?.jogador1}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDate(p.data)} • {p.contexto} • {p.tipo}
                    </div>
                    {p.placar?.placarFinal && (
                      <div className="text-sm font-mono mt-1">{p.placar.placarFinal}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
