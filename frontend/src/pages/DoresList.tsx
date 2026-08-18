import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, AlertTriangle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const REGIOES = [
  'joelho-direito', 'joelho-esquerdo', 'ombro-direito', 'ombro-esquerdo',
  'costas', 'punho', 'cotovelo', 'tornozelo', 'quadril', 'outro',
] as const;

export function DoresList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    regiao: 'joelho-direito' as typeof REGIOES[number],
    intensidade: 5,
    tipo: 'cronica' as 'aguda' | 'cronica' | 'pontada' | 'queimacao' | 'rigidez' | 'latejante',
    contexto: 'diaria' as 'pre-treino' | 'durante-treino' | 'pos-treino' | 'repouso' | 'diaria',
    observacoes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['/app/dores', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'users', user.uid, '/app/dores'), orderBy('data', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const alertaAtivado = form.intensidade >= 7;
      await addDoc(collection(db, 'users', user.uid, '/app/dores'), {
        ...form,
        data: new Date().toISOString(),
        alertaAtivado,
        createdAt: serverTimestamp(),
      });
      if (alertaAtivado) {
        toast({
          title: '⚠️ Dor aguda registrada',
          description: 'Considere pausar o treino e consultar profissional.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Dor registrada', variant: 'success' });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/app/dores'] });
      setOpen(false);
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🩹 Dores</h1>
        <Button onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4" /> {open ? 'Cancelar' : 'Registrar dor'}
        </Button>
      </div>

      {open && (
        <Card className={cn(form.intensidade >= 7 && 'border-red-500')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {form.intensidade >= 7 && <AlertTriangle className="h-5 w-5 text-red-500" />}
              Registrar dor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Região</Label>
              <select
                value={form.regiao}
                onChange={(e) => setForm({ ...form, regiao: e.target.value as any })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {REGIOES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Intensidade ({form.intensidade}/10)</Label>
              <input
                type="range"
                min="0"
                max="10"
                value={form.intensidade}
                onChange={(e) => setForm({ ...form, intensidade: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Tipo</Label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {['aguda', 'cronica', 'pontada', 'queimacao', 'rigidez', 'latejante'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Contexto</Label>
                <select
                  value={form.contexto}
                  onChange={(e) => setForm({ ...form, contexto: e.target.value as any })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {['pre-treino', 'durante-treino', 'pos-treino', 'repouso', 'diaria'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="O que melhora? O que piora? Medicação?"
              />
            </div>
            <Button onClick={() => add.mutate()} disabled={add.isPending} className="w-full">
              {add.isPending ? 'Salvando...' : 'Registrar'}
            </Button>
          </CardContent>
        </Card>
      )}

      {data && data.length === 0 ? (
        <EmptyState icone="🩹" titulo="Nenhuma dor registrada" descricao="Bons registros ajudam a prevenir lesões." />
      ) : (
        <div className="space-y-2">
          {data?.map((d: any) => (
            <Card key={d.id} className={cn(d.intensidade >= 7 && 'border-red-500/50')}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{d.regiao.replace('-', ' ')}</span>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        d.intensidade >= 7 ? 'bg-red-500/10 text-red-500' :
                        d.intensidade >= 4 ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-green-500/10 text-green-500'
                      )}>
                        {d.intensidade}/10
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(d.data)} • {d.tipo} • {d.contexto}
                    </div>
                    {d.observacoes && (
                      <p className="text-sm mt-2 text-muted-foreground">{d.observacoes}</p>
                    )}
                  </div>
                  {d.alertaAtivado && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
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
