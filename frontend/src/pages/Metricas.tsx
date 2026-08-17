import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { formatDate, formatKg } from '@/lib/utils';

export function Metricas() {
  const { user } = useAuth();

  const { data: pesos, isLoading: loadPeso } = useQuery({
    queryKey: ['peso-chart', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'users', user.uid, 'peso'), orderBy('data', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ data: d.data(), id: d.id } as any));
    },
    enabled: !!user,
  });

  const { data: treinos, isLoading: loadTreinos } = useQuery({
    queryKey: ['treinos-chart', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'users', user.uid, 'treinos'), orderBy('data', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ data: d.data(), id: d.id } as any));
    },
    enabled: !!user,
  });

  const { data: dores, isLoading: loadDores } = useQuery({
    queryKey: ['dores-chart', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'users', user.uid, 'dores'), orderBy('data', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ data: d.data(), id: d.id } as any));
    },
    enabled: !!user,
  });

  if (loadPeso || loadTreinos || loadDores) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  const pesoChart = (pesos || []).map((p: any) => ({
    data: formatDate(p.data.data, { day: '2-digit', month: '2-digit' }),
    peso: p.data.pesoKg,
  }));

  // Treinos por semana
  const treinosPorSemana: Record<string, number> = {};
  (treinos || []).forEach((t: any) => {
    const d = new Date(t.data.data);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const key = startOfWeek.toISOString().slice(0, 10);
    treinosPorSemana[key] = (treinosPorSemana[key] || 0) + (t.data.duracaoMin || 0) / 60;
  });
  const treinoChart = Object.entries(treinosPorSemana)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([semana, horas]) => ({ semana: semana.slice(5), horas: Number(horas.toFixed(1)) }));

  // Dores por região
  const doresPorRegiao: Record<string, number> = {};
  (dores || []).forEach((d: any) => {
    const reg = d.data.regiao;
    doresPorRegiao[reg] = (doresPorRegiao[reg] || 0) + 1;
  });
  const doresChart = Object.entries(doresPorRegiao).map(([regiao, count]) => ({ regiao, count }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📊 Métricas</h1>
        <Button asChild>
          <Link to="/metricas/avaliacoes/nova">Preencher avaliação mensal</Link>
        </Button>
      </div>

      {pesoChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução do peso</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={pesoChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="data" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {treinoChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Horas de treino por semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={treinoChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="horas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {doresChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de dores por região</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={doresChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis dataKey="regiao" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={120} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {pesoChart.length === 0 && treinoChart.length === 0 && (
        <EmptyState
          icone="📊"
          titulo="Sem dados ainda"
          descricao="Comece registrando peso, treinos e dores para ver suas métricas."
        />
      )}
    </div>
  );
}
