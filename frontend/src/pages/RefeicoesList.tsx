import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

const TIPOS = ['cafe', 'lanche-manha', 'almoco', 'lanche-tarde', 'jantar', 'ceia', 'pre-treino', 'pos-treino'];

export function RefeicoesList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: 'almoco',
    descricao: '',
    contexto: 'normal',
    kcal: '',
    proteina: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['refeicoes', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'toppkb_users', user.uid, 'nutricao'), orderBy('data', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await addDoc(collection(db, 'toppkb_users', user.uid, 'nutricao'), {
        data: new Date().toISOString(),
        tipo: form.tipo,
        alimentos: [{ nome: form.descricao, quantidade: '1 porção' }],
        contexto: form.contexto,
        kcalTotal: Number(form.kcal) || null,
        proteinaTotal: Number(form.proteina) || null,
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['refeicoes'] });
      setOpen(false);
      setForm({ tipo: 'almoco', descricao: '', contexto: 'normal', kcal: '', proteina: '' });
      toast({ title: 'Refeição registrada!', variant: 'success' });
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🥗 Refeições</h1>
        <Button onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4" /> {open ? 'Cancelar' : 'Nova refeição'}
        </Button>
      </div>

      {open && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>Contexto</Label>
                <select value={form.contexto} onChange={(e) => setForm({ ...form, contexto: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {['treino', 'descanso', 'torneio', 'normal'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>O que comeu?</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Arroz, feijão, frango, salada" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kcal (opcional)</Label>
                <Input type="number" value={form.kcal} onChange={(e) => setForm({ ...form, kcal: e.target.value })} />
              </div>
              <div>
                <Label>Proteína g (opcional)</Label>
                <Input type="number" value={form.proteina} onChange={(e) => setForm({ ...form, proteina: e.target.value })} />
              </div>
            </div>
            <Button onClick={() => add.mutate()} disabled={add.isPending || !form.descricao} className="w-full">
              {add.isPending ? 'Salvando...' : 'Registrar'}
            </Button>
          </CardContent>
        </Card>
      )}

      {data && data.length === 0 ? (
        <EmptyState icone="🥗" titulo="Nenhuma refeição registrada" descricao="Registre para acompanhar macros e déficit calórico." />
      ) : (
        <div className="space-y-2">
          {data?.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium capitalize">{r.tipo.replace('-', ' ')}</div>
                    <div className="text-sm mt-1">{r.alimentos?.map((a: any) => a.nome).join(', ')}</div>
                    <div className="text-xs text-muted-foreground mt-1">{formatDateTime(r.data)}</div>
                  </div>
                  {r.kcalTotal && (
                    <div className="text-right text-sm">
                      <div className="font-bold">{r.kcalTotal} kcal</div>
                      {r.proteinaTotal && <div className="text-xs text-muted-foreground">{r.proteinaTotal}g prot</div>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
