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
import { ChevronLeft, Save, Moon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type FormData = {
  data: string;
  horaDormir: string;
  horaAcordar: string;
  horasDormidas: number;
  qualidade: 1 | 2 | 3 | 4 | 5;
  fatores: string[];
  observacoes: string;
};

const FATORES = [
  { id: 'cafeina', label: 'Cafeína' },
  { id: 'alcool', label: 'Álcool' },
  { id: 'tela', label: 'Tela antes de dormir' },
  { id: 'estresse', label: 'Estresse' },
  { id: 'exercicio', label: 'Exercício' },
  { id: 'ambiente', label: 'Ambiente (barulho/luz)' },
  { id: 'refeicao', label: 'Refeição pesada' },
  { id: 'viagem', label: 'Viagem/fuso' },
  { id: 'doenca', label: 'Doença' },
];

export function SonoForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const qc = useQueryClient();

  const { data: sonoExistente, isLoading: loading } = useQuery({
    queryKey: ['sono', id],
    queryFn: async () => {
      if (!id || !user) return null;
      const snap = await getDoc(doc(db, 'toppkb_users', user.uid, 'sono', id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
    },
    enabled: !!id && !!user,
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      horaDormir: '23:00',
      horaAcordar: '07:00',
      horasDormidas: 8,
      qualidade: 4,
      fatores: [],
      observacoes: '',
      ...(sonoExistente || {}),
    },
  });

  const qualidade = watch('qualidade');
  const fatores = watch('fatores') || [];
  const horas = watch('horasDormidas');

  const toggleFator = (id: string) => {
    setValue('fatores', fatores.includes(id) ? fatores.filter((f) => f !== id) : [...fatores, id]);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Sem usuário');
      const payload = {
        uid: user.uid,
        ...data,
        horasDormidas: Number(data.horasDormidas),
        updatedAt: serverTimestamp(),
      };
      if (id) {
        await setDoc(doc(db, 'toppkb_users', user.uid, 'sono', id), payload, { merge: true });
        return 'updated' as const;
      } else {
        await addDoc(collection(db, 'toppkb_users', user.uid, 'sono'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        return 'created' as const;
      }
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['sono', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(a === 'created' ? 'Sono registrado! 😴' : 'Sono atualizado!');
      navigate('/app/sono');
    },
  });

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/sono')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              {id ? 'Editar registro' : 'Registrar sono'}
            </CardTitle>
            <CardDescription>Qualidade do sono afeta diretamente performance e recuperação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="data">Data</Label>
                <Input id="data" type="date" {...register('data', { required: true })} />
              </div>
              <div>
                <Label htmlFor="dormir">Dormiu</Label>
                <Input id="dormir" type="time" {...register('horaDormir')} />
              </div>
              <div>
                <Label htmlFor="acordar">Acordou</Label>
                <Input id="acordar" type="time" {...register('horaAcordar')} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">Horas dormidas</Label>
                <span className="text-sm font-semibold">{horas}h</span>
              </div>
              <input
                type="range" min="3" max="12" step="0.5"
                value={horas}
                onChange={(e) => setValue('horasDormidas', Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>3h</span>
                <span className="text-emerald-600 dark:text-emerald-400">7-9h (ideal)</span>
                <span>12h</span>
              </div>
              {horas < 7 && (
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 flex gap-1">
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  Para atletas 50+, menos de 7h compromete recuperação.
                </p>
              )}
            </div>

            <div>
              <Label>Qualidade percebida</Label>
              <div className="grid grid-cols-5 gap-1.5 mt-2">
                {[1, 2, 3, 4, 5].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setValue('qualidade', q as any)}
                    className={cn(
                      "p-2 rounded-md border text-center",
                      qualidade === q
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="text-lg">
                      {q === 1 ? '😩' : q === 2 ? '😪' : q === 3 ? '😐' : q === 4 ? '😊' : '🤩'}
                    </div>
                    <div className="text-[10px]">
                      {q === 1 ? 'Péssimo' : q === 2 ? 'Ruim' : q === 3 ? 'OK' : q === 4 ? 'Bom' : 'Ótimo'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Fatores que afetaram</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {FATORES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFator(f.id)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border",
                      fatores.includes(f.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="obs">Observações</Label>
              <textarea
                id="obs"
                placeholder="Acordou durante a noite? Sonhos? Ronco?"
                {...register('observacoes')}
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/sono')}>
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
