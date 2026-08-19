import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { ChevronLeft, Save, Scale, Info } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

type FormData = {
  data: string;
  peso: number;
  gorduraPercent?: number;
  massaMagra?: number;
  observacoes: string;
};

export function PesoForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const qc = useQueryClient();
  const userDoc = useAuthStore((s) => s.userDoc);

  const { data: pesoExistente, isLoading: loading } = useQuery({
    queryKey: ['peso', id],
    queryFn: async () => {
      if (!id || !user) return null;
      const snap = await getDoc(doc(db, 'toppkb_users', user.uid, 'peso', id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
    },
    enabled: !!id && !!user,
  });

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      peso: 0,
      observacoes: '',
      ...(pesoExistente || {}),
    },
  });

  const peso = watch('peso');
  const pesoMeta = userDoc?.pesoMeta;
  const diff = pesoMeta && peso ? (peso - pesoMeta).toFixed(1) : null;

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Sem usuário');
      const payload = {
        uid: user.uid,
        ...data,
        peso: Number(data.peso),
        gorduraPercent: data.gorduraPercent ? Number(data.gorduraPercent) : null,
        massaMagra: data.massaMagra ? Number(data.massaMagra) : null,
        updatedAt: serverTimestamp(),
      };
      if (id) {
        await setDoc(doc(db, 'toppkb_users', user.uid, 'peso', id), payload, { merge: true });
        return 'updated' as const;
      } else {
        await addDoc(collection(db, 'toppkb_users', user.uid, 'peso'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        return 'created' as const;
      }
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['peso', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(a === 'created' ? 'Peso registrado! ⚖️' : 'Peso atualizado!');
      navigate('/app/peso');
    },
  });

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/peso')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              {id ? 'Editar pesagem' : 'Nova pesagem'}
            </CardTitle>
            <CardDescription>
              {pesoMeta ? `Meta: ${pesoMeta}kg · ${diff && Math.abs(Number(diff)) > 0 ? `${diff}kg ${Number(diff) > 0 ? 'acima' : 'abaixo'}` : 'na meta'}` : 'Defina sua meta em Configurações'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="data">Data</Label>
                <Input id="data" type="date" {...register('data', { required: true })} />
              </div>
              <div>
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  {...register('peso', { required: true, min: 30, max: 300 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="gordura">% Gordura (opcional)</Label>
                <Input id="gordura" type="number" step="0.1" {...register('gorduraPercent')} />
              </div>
              <div>
                <Label htmlFor="magra">Massa magra (kg, opcional)</Label>
                <Input id="magra" type="number" step="0.1" {...register('massaMagra')} />
              </div>
            </div>
            <div>
              <Label htmlFor="obs">Observações</Label>
              <textarea
                id="obs"
                placeholder="Em jejum? Após treino? Balança calibrada?"
                {...register('observacoes')}
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground flex gap-1">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
              Dica: pese sempre no mesmo horário (ideal: ao acordar, em jejum).
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/peso')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting || saveMutation.isPending ? 'Salvando...' : (id ? 'Atualizar' : 'Salvar')}
          </Button>
        </div>
      </form>
    </div>
  );
}
