import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Plus } from 'lucide-react';
import { formatDate, formatKg, calcularIMC, classificarIMC } from '@/lib/utils';

export function PesoList() {
  const { user, userDoc } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [novoPeso, setNovoPeso] = useState('');
  const [novaData, setNovaData] = useState(new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ['/app/peso', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'toppkb_users', user.uid, 'peso'), orderBy('data', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const addPeso = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const kg = Number(novoPeso);
      if (!kg || kg < 30 || kg > 250) throw new Error('Peso inválido');
      const imc = userDoc?.altura ? calcularIMC(kg, userDoc.altura) : null;
      await addDoc(collection(db, 'toppkb_users', user.uid, 'peso'), {
        data: new Date(novaData).toISOString(),
        pesoKg: kg,
        imc,
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/app/peso'] });
      qc.invalidateQueries({ queryKey: ['/app/dashboard'] });
      setOpen(false);
      setNovoPeso('');
      toast({ title: 'Peso registrado!', variant: 'success' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const chartData = (data || []).map((p: any) => ({
    data: formatDate(p.data, { day: '2-digit', month: '2-digit' }),
    peso: p.pesoKg,
  }));

  const pesoAtual = data && data.length > 0 ? data[data.length - 1].pesoKg : userDoc?.pesoInicial;
  const pesoMeta = userDoc?.pesoMeta || 80;
  const imc = userDoc?.altura && pesoAtual ? calcularIMC(pesoAtual, userDoc.altura) : null;
  const imcClass = imc ? classificarIMC(imc) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">⚖️ Peso</h1>
        <Button onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4" /> {open ? 'Cancelar' : 'Registrar peso'}
        </Button>
      </div>

      {open && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data</Label>
                <Input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
              </div>
              <div>
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={novoPeso}
                  onChange={(e) => setNovoPeso(e.target.value)}
                  placeholder="95.2"
                  autoFocus
                />
              </div>
            </div>
            <Button
              onClick={() => addPeso.mutate()}
              disabled={addPeso.isPending}
              className="mt-3 w-full"
            >
              {addPeso.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Atual</div>
            <div className="text-2xl font-bold">{pesoAtual ? formatKg(pesoAtual) : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Meta</div>
            <div className="text-2xl font-bold text-primary">{formatKg(pesoMeta)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">IMC</div>
            <div className="text-2xl font-bold">{imc ? imc.toFixed(1) : '—'}</div>
            {imcClass && <div className={`text-xs ${imcClass.cor}`}>{imcClass.label}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Falta</div>
            <div className="text-2xl font-bold">
              {pesoAtual ? formatKg(pesoAtual - pesoMeta) : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Evolução</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="data" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                />
                <ReferenceLine y={pesoMeta} stroke="hsl(var(--primary))" strokeDasharray="5 5" label="Meta" />
                <Line type="monotone" dataKey="/app/peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <EmptyState icone="⚖️" titulo="Nenhum peso registrado" descricao="Registre seu peso para acompanhar a evolução." />
      )}
    </div>
  );
}
