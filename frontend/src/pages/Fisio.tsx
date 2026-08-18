import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Heart } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function Fisio() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    profissional: '',
    duracaoMin: 60,
    observacoes: '',
    proximaSessao: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['/app/fisio', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'users', user.uid, '/app/fisio'), orderBy('data', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await addDoc(collection(db, 'users', user.uid, '/app/fisio'), {
        ...form,
        tipo: 'sessao',
        exercicios: [],
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/app/fisio'] });
      setOpen(false);
      toast({ title: 'Sessão registrada!', variant: 'success' });
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">💪 Fisio</h1>
        <Button onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4" /> {open ? 'Cancelar' : 'Nova sessão'}
        </Button>
      </div>

      {open && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </div>
              <div>
                <Label>Profissional</Label>
                <Input value={form.profissional} onChange={(e) => setForm({ ...form, profissional: e.target.value })} placeholder="Dr. João" />
              </div>
            </div>
            <div>
              <Label>Duração (min)</Label>
              <Input type="number" value={form.duracaoMin} onChange={(e) => setForm({ ...form, duracaoMin: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </div>
            <div>
              <Label>Próxima sessão</Label>
              <Input type="date" value={form.proximaSessao} onChange={(e) => setForm({ ...form, proximaSessao: e.target.value })} />
            </div>
            <Button onClick={() => add.mutate()} disabled={add.isPending} className="w-full">
              {add.isPending ? 'Salvando...' : 'Registrar'}
            </Button>
          </CardContent>
        </Card>
      )}

      {data && data.length === 0 ? (
        <EmptyState icone="💪" titulo="Nenhuma sessão registrada" />
      ) : (
        <div className="space-y-2">
          {data?.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="font-medium">{formatDate(s.data)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {s.profissional} • {s.duracaoMin}min
                    </div>
                    {s.observacoes && <p className="text-sm mt-2">{s.observacoes}</p>}
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
