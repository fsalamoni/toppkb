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
import { Plus, Trophy, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function TorneiosList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    dataInicio: new Date().toISOString().slice(0, 10),
    local: '',
    categoria: '50+',
    nivel: 'regional',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['/app/torneios', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'users', user.uid, '/app/torneios'), orderBy('dataInicio', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await addDoc(collection(db, 'users', user.uid, '/app/torneios'), {
        ...form,
        dataInicio: new Date(form.dataInicio).toISOString(),
        status: 'planejado',
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/app/torneios'] });
      setOpen(false);
      setForm({ nome: '', dataInicio: new Date().toISOString().slice(0, 10), local: '', categoria: '50+', nivel: 'regional' });
      toast({ title: 'Torneio registrado!', variant: 'success' });
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const diasAte = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🏆 Torneios</h1>
        <Button onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4" /> {open ? 'Cancelar' : 'Novo torneio'}
        </Button>
      </div>

      {open && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div>
              <Label>Nome do torneio</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Open Regional SP" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
              </div>
              <div>
                <Label>Local</Label>
                <Input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} placeholder="São Paulo, SP" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {['50+', '45+', 'aberto', 'simples', 'duplas', 'mista'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>Nível</Label>
                <select value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {['regional', 'estadual', 'nacional', 'internacional'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <Button onClick={() => add.mutate()} disabled={!form.nome || add.isPending} className="w-full">
              {add.isPending ? 'Salvando...' : 'Registrar torneio'}
            </Button>
          </CardContent>
        </Card>
      )}

      {data && data.length === 0 ? (
        <EmptyState icone="🏆" titulo="Nenhum torneio" descricao="Adicione torneios para acompanhar o calendário competitivo." />
      ) : (
        <div className="space-y-2">
          {data?.map((t: any) => {
            const dias = diasAte(t.dataInicio);
            return (
              <Card key={t.id} className={cn(dias > 0 && dias <= 30 && 'border-primary')}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Trophy className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <div className="font-medium">{t.nome}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(t.dataInicio)} • {t.local} • {t.categoria}
                        </div>
                      </div>
                    </div>
                    {dias > 0 ? (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{dias}</div>
                        <div className="text-xs text-muted-foreground">dias</div>
                      </div>
                    ) : (
                      <span className={cn('text-xs px-2 py-0.5 rounded', t.status === 'concluido' ? 'bg-green-500/10 text-green-500' : 'bg-muted')}>
                        {t.status}
                      </span>
                    )}
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
