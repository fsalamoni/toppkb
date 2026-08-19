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
import { ChevronLeft, Save, Ruler, Info } from 'lucide-react';

type FormData = {
  data: string;
  // Circunferências (cm)
  pescoco?: number;
  ombros?: number;
  peito?: number;
  bracoEsq?: number;
  bracoDir?: number;
  antebracoEsq?: number;
  antebracoDir?: number;
  cintura?: number;
  abdomen?: number;
  quadril?: number;
  coxaEsq?: number;
  coxaDir?: number;
  panturrilhaEsq?: number;
  panturrilhaDir?: number;
  // Dobras cutâneas (mm) — opcional
  triceps?: number;
  abdominal?: number;
  suprailiaca?: number;
  coxaMedia?: number;
  // % gordura
  gorduraPercent?: number;
  observacoes: string;
};

export function MedidasForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const qc = useQueryClient();

  const { data: medidaExistente, isLoading: loading } = useQuery({
    queryKey: ['medida', id],
    queryFn: async () => {
      if (!id || !user) return null;
      const snap = await getDoc(doc(db, 'toppkb_users', user.uid, 'medidas', id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
    },
    enabled: !!id && !!user,
  });

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      observacoes: '',
      ...(medidaExistente || {}),
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Sem usuário');
      // Converter tudo para number ou null
      const payload: any = { uid: user.uid, data: data.data, observacoes: data.observacoes, updatedAt: serverTimestamp() };
      Object.keys(data).forEach((k) => {
        if (k === 'data' || k === 'observacoes' || k === 'uid' || k === 'updatedAt') return;
        const v = (data as any)[k];
        payload[k] = v === '' || v === undefined || v === null ? null : Number(v);
      });
      if (id) {
        await setDoc(doc(db, 'toppkb_users', user.uid, 'medidas', id), payload, { merge: true });
        return 'updated' as const;
      } else {
        await addDoc(collection(db, 'toppkb_users', user.uid, 'medidas'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        return 'created' as const;
      }
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['medidas', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(a === 'created' ? 'Medidas registradas! 📏' : 'Medidas atualizadas!');
      navigate('/app/medidas');
    },
  });

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/medidas')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              {id ? 'Editar medidas' : 'Novas medidas'}
            </CardTitle>
            <CardDescription>Circunferências + composição corporal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" {...register('data', { required: true })} />
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Circunferências (cm)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field id="pescoco" label="Pescoço" {...register('pescoco')} />
                <Field id="ombros" label="Ombros" {...register('ombros')} />
                <Field id="peito" label="Peito" {...register('peito')} />
                <Field id="bracoEsq" label="Braço Esq." {...register('bracoEsq')} />
                <Field id="bracoDir" label="Braço Dir." {...register('bracoDir')} />
                <Field id="antebracoEsq" label="Antebraço Esq." {...register('antebracoEsq')} />
                <Field id="antebracoDir" label="Antebraço Dir." {...register('antebracoDir')} />
                <Field id="cintura" label="Cintura" {...register('cintura')} />
                <Field id="abdomen" label="Abdômen" {...register('abdomen')} />
                <Field id="quadril" label="Quadril" {...register('quadril')} />
                <Field id="coxaEsq" label="Coxa Esq." {...register('coxaEsq')} />
                <Field id="coxaDir" label="Coxa Dir." {...register('coxaDir')} />
                <Field id="panturrilhaEsq" label="Panturrilha Esq." {...register('panturrilhaEsq')} />
                <Field id="panturrilhaDir" label="Panturrilha Dir." {...register('panturrilhaDir')} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Dobras cutâneas (mm) — opcional</h3>
              <p className="text-xs text-muted-foreground mb-2">Requer adipômetro. Usado para cálculo de % gordura por protocolo Jackson-Pollock 7 ou 3 dobras.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field id="triceps" label="Tríceps" {...register('triceps')} />
                <Field id="abdominal" label="Abdominal" {...register('abdominal')} />
                <Field id="suprailiaca" label="Supra-ilíaca" {...register('suprailiaca')} />
                <Field id="coxaMedia" label="Coxa média" {...register('coxaMedia')} />
              </div>
            </div>

            <div>
              <Label htmlFor="gordura">% Gordura corporal (opcional)</Label>
              <Input id="gordura" type="number" step="0.1" placeholder="22.5" {...register('gorduraPercent')} />
            </div>

            <div>
              <Label htmlFor="obs">Observações</Label>
              <textarea
                id="obs"
                placeholder="Avaliação em jejum? Horário? Quem mediu?"
                {...register('observacoes')}
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <p className="text-xs text-muted-foreground flex gap-1 p-2 rounded-md bg-amber-500/10 border border-amber-500/30">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Dica para 50+:</strong> Cuidado com perda brusca de massa magra (sarcopenia).
                Monitore braço, coxa e panturrilha — perda de força/circunferência é sinal de alerta.
              </span>
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/medidas')}>
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

function Field({ id, label, ...rest }: any) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input id={id} type="number" step="0.1" className="h-8 text-sm" {...rest} />
    </div>
  );
}
