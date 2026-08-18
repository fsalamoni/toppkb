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
import { formatDate } from '@/lib/utils';

export function SonoList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    horas: 7,
    qualidade: 4,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['/app/sono', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'users', user.uid, '/app/sono'), orderBy('data', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await addDoc(collection(db, 'users', user.uid, '/app/sono'), {
        data: new Date(form.data).toISOString(),
        horasTotais: Number(form.horas),
        qualidade: Number(form.qualidade),
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/app/sono'] });
      setOpen(false);
      toast({ title: 'Sono registrado!', variant: 'success' });
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const media = data && data.length > 0
    ? (data.reduce((acc: number, s: any) => acc + (s.horasTotais || 0), 0) / data.length).toFixed(1)
    : '—';

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">😴 Sono</h1>
        <Button onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4" /> {open ? 'Cancelar' : 'Registrar noite'}
        </Button>
      </div>

      {data && data.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Média recente</div>
            <div className="text-3xl font-bold">{media}h</div>
          </CardContent>
        </Card>
      )}

      {open && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div>
              <Label>Data que acordou</Label>
              <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
            <div>
              <Label>Horas dormidas</Label>
              <Input type="number" step="0.5" value={form.horas} onChange={(e) => setForm({ ...form, horas: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Qualidade ({form.qualidade}/5)</Label>
              <input type="range" min="1" max="5" value={form.qualidade} onChange={(e) => setForm({ ...form, qualidade: Number(e.target.value) })} className="w-full" />
            </div>
            <Button onClick={() => add.mutate()} disabled={add.isPending} className="w-full">
              {add.isPending ? 'Salvando...' : 'Registrar'}
            </Button>
          </CardContent>
        </Card>
      )}

      {data && data.length === 0 ? (
        <EmptyState icone="😴" titulo="Nenhuma noite registrada" />
      ) : (
        <div className="space-y-2">
          {data?.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="pt-6 flex justify-between items-center">
                <div>
                  <div className="font-medium">{formatDate(s.data)}</div>
                  <div className="text-sm text-muted-foreground">{'⭐'.repeat(s.qualidade)}</div>
                </div>
                <div className="text-2xl font-bold">{s.horasTotais}h</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
