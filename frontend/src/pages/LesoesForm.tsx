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
import { ChevronLeft, Save, Heart, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type FormData = {
  data: string;
  nome: string;        // ex: "Tendinite patelar"
  regiao: string;
  tipo: 'muscular' | 'tendinea' | 'ligamentar' | 'articular' | 'ossea' | 'outro';
  gravidade: 'leve' | 'moderada' | 'severa' | 'cirurgia';
  status: 'em-tratamento' | 'recuperada' | 'cronica';
  dataRecuperacao?: string;
  tratamento: string;
  profissional: string;  // fisio, médico
  custo: number;
  observacoes: string;
};

const TIPO_OPCOES = [
  { value: 'muscular', label: 'Muscular', desc: 'Estiramento, ruptura' },
  { value: 'tendinea', label: 'Tendínea', desc: 'Tendinite, tenossinovite' },
  { value: 'ligamentar', label: 'Ligamentar', desc: 'Estiramento, ruptura' },
  { value: 'articular', label: 'Articular', desc: 'Cartilagem, menisco' },
  { value: 'ossea', label: 'Óssea', desc: 'Fratura, estresse' },
  { value: 'outro', label: 'Outro' },
];

const GRAVIDADE_OPCOES = [
  { value: 'leve', label: 'Leve', desc: '1-2 semanas', cor: 'emerald' },
  { value: 'moderada', label: 'Moderada', desc: '2-6 semanas', cor: 'amber' },
  { value: 'severa', label: 'Severa', desc: '+6 semanas', cor: 'orange' },
  { value: 'cirurgia', label: 'Cirurgia', desc: 'Procedimento + reabilitação', cor: 'red' },
];

const STATUS_OPCOES = [
  { value: 'em-tratamento', label: '🔴 Em tratamento' },
  { value: 'recuperada', label: '✅ Recuperada' },
  { value: 'cronica', label: '🟡 Crônica' },
];

export function LesoesForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const qc = useQueryClient();

  const { data: lesaoExistente, isLoading: loading } = useQuery({
    queryKey: ['lesao', id],
    queryFn: async () => {
      if (!id || !user) return null;
      const snap = await getDoc(doc(db, 'toppkb_users', user.uid, 'lesoes', id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
    },
    enabled: !!id && !!user,
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      nome: '',
      regiao: '',
      tipo: 'muscular',
      gravidade: 'leve',
      status: 'em-tratamento',
      tratamento: '',
      profissional: '',
      custo: 0,
      observacoes: '',
      ...(lesaoExistente || {}),
    },
  });

  const tipo = watch('tipo');
  const gravidade = watch('gravidade');
  const status = watch('status');

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Sem usuário');
      const payload = {
        uid: user.uid,
        ...data,
        custo: Number(data.custo),
        updatedAt: serverTimestamp(),
      };
      if (id) {
        await setDoc(doc(db, 'toppkb_users', user.uid, 'lesoes', id), payload, { merge: true });
        return 'updated' as const;
      } else {
        await addDoc(collection(db, 'toppkb_users', user.uid, 'lesoes'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        return 'created' as const;
      }
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['lesoes', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(a === 'created' ? 'Lesão registrada' : 'Lesão atualizada');
      navigate('/app/lesoes');
    },
  });

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/lesoes')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {id ? 'Editar lesão' : 'Registrar lesão'}
            </CardTitle>
            <CardDescription>Histórico médico + tratamento + recuperação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da lesão</Label>
              <Input id="nome" placeholder="Tendinite patelar" {...register('nome', { required: true })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="data">Data início</Label>
                <Input id="data" type="date" {...register('data', { required: true })} />
              </div>
              <div>
                <Label htmlFor="regiao">Região</Label>
                <Input id="regiao" placeholder="Joelho direito" {...register('regiao')} />
              </div>
            </div>

            <div>
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {TIPO_OPCOES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setValue('tipo', t.value as any)}
                    className={cn(
                      "text-left p-2 rounded-md border text-xs",
                      tipo === t.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="font-medium">{t.label}</div>
                    <div className="text-muted-foreground mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Gravidade</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {GRAVIDADE_OPCOES.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setValue('gravidade', g.value as any)}
                    className={cn(
                      "text-left p-2 rounded-md border text-xs",
                      gravidade === g.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="font-medium">{g.label}</div>
                    <div className="text-muted-foreground mt-0.5">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <div className="flex gap-2 mt-2">
                {STATUS_OPCOES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setValue('status', s.value as any)}
                    className={cn(
                      "flex-1 p-2 rounded-md border text-sm",
                      status === s.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="recuperacao">Data de recuperação (se aplicável)</Label>
              <Input id="recuperacao" type="date" {...register('dataRecuperacao')} />
            </div>

            <div>
              <Label htmlFor="tratamento">Tratamento realizado</Label>
              <textarea
                id="tratamento"
                placeholder="Fisioterapia 2x/semana, gelo 3x/dia, anti-inflamatório..."
                {...register('tratamento')}
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="profissional">Profissional(is) envolvido(s)</Label>
              <Input id="profissional" placeholder="Dr. Fulano (ortopedista), Fisio Beltrano" {...register('profissional')} />
            </div>
            <div>
              <Label htmlFor="custo">Custo estimado (R$)</Label>
              <Input id="custo" type="number" step="0.01" {...register('custo')} />
            </div>
            <div>
              <Label htmlFor="obs">Observações</Label>
              <textarea
                id="obs"
                placeholder="Causa, learnings, como prevenir no futuro..."
                {...register('observacoes')}
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground flex gap-1">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
              Mantenha um histórico completo — isso ajuda a identificar padrões e prevenir reincidência.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/lesoes')}>
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
