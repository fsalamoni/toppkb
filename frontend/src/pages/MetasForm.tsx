import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { ChevronLeft, Save, Target, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type FormData = {
  titulo: string;
  descricao: string;
  prazo: string;
  prazoMeses: number;
  categoria: 'tecnica' | 'fisica' | 'tatica' | 'mental' | 'competitiva' | 'estilo-vida' | 'carreira';
  status: 'ativa' | 'concluida' | 'abandonada';
  progresso: number;       // 0-100
  criterios: string;        // SMART
  obstaculos: string;
  plano: string;
};

const CATEGORIA_OPCOES = [
  { value: 'tecnica', label: '🎯 Técnica', desc: 'Dink, volleys, saques' },
  { value: 'fisica', label: '💪 Física', desc: 'Força, mobilidade, resistência' },
  { value: 'tatica', label: '🧠 Tática', desc: 'Estratégia, leitura de jogo' },
  { value: 'mental', label: '💭 Mental', desc: 'Foco, confiança, gestão' },
  { value: 'competitiva', label: '🏆 Competitiva', desc: 'Rankings, torneios, metas de resultado' },
  { value: 'estilo-vida', label: '🌱 Estilo de vida', desc: 'Sono, nutrição, peso' },
  { value: 'carreira', label: '📈 Carreira', desc: 'Comunidade, network, legado' },
];

const STATUS_OPCOES = [
  { value: 'ativa', label: '🟢 Ativa', desc: 'Em progresso' },
  { value: 'concluida', label: '✅ Concluída', desc: 'Atingida' },
  { value: 'abandonada', label: '⚫ Abandonada', desc: 'Desistiu' },
];

export function MetasForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const qc = useQueryClient();

  const { data: metaExistente, isLoading: loading } = useQuery({
    queryKey: ['meta', id],
    queryFn: async () => {
      if (!id || !user) return null;
      const snap = await getDoc(doc(db, 'toppkb_users', user.uid, 'metas', id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
    },
    enabled: !!id && !!user,
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      titulo: '',
      descricao: '',
      prazo: '',
      prazoMeses: 12,
      categoria: 'competitiva',
      status: 'ativa',
      progresso: 0,
      criterios: '',
      obstaculos: '',
      plano: '',
      ...(metaExistente || {}),
    },
  });

  const categoria = watch('categoria');
  const status = watch('status');
  const progresso = watch('progresso');

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Sem usuário');
      const payload = {
        uid: user.uid,
        ...data,
        prazoMeses: Number(data.prazoMeses),
        progresso: Number(data.progresso),
        updatedAt: serverTimestamp(),
      };
      if (id) {
        await setDoc(doc(db, 'toppkb_users', user.uid, 'metas', id), payload, { merge: true });
        return 'updated' as const;
      } else {
        await addDoc(collection(db, 'toppkb_users', user.uid, 'metas'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        return 'created' as const;
      }
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['metas', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(a === 'created' ? 'Meta registrada! 🎯' : 'Meta atualizada!');
      navigate('/app/metas');
    },
  });

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/metas')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {id ? 'Editar meta' : 'Nova meta'}
            </CardTitle>
            <CardDescription>Use o método SMART: específica, mensurável, alcançável, relevante, com prazo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título da meta</Label>
              <Input id="titulo" placeholder="Ser top 50 do Brasil 50+ em 2030" {...register('titulo', { required: true })} />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" placeholder="Detalhes da meta" rows={2} {...register('descricao')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="prazo">Prazo (data final)</Label>
                <Input id="prazo" type="date" {...register('prazo')} />
              </div>
              <div>
                <Label htmlFor="prazoMeses">Prazo (meses)</Label>
                <Input id="prazoMeses" type="number" min="1" {...register('prazoMeses')} />
              </div>
            </div>

            <div>
              <Label>Categoria</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {CATEGORIA_OPCOES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setValue('categoria', c.value as any)}
                    className={cn(
                      "text-left p-2 rounded-md border text-xs",
                      categoria === c.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="font-medium">{c.label}</div>
                    <div className="text-muted-foreground mt-0.5">{c.desc}</div>
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
                    <div className="font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">Progresso</Label>
                <span className="text-sm font-semibold">{progresso}%</span>
              </div>
              <input
                type="range" min="0" max="100" step="5"
                {...register('progresso', { valueAsNumber: true })}
                className="w-full accent-primary"
              />
              <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="criterios">Critérios de sucesso (SMART)</Label>
              <Textarea
                id="criterios"
                placeholder="Específicos, mensuráveis. Ex: 'Estar entre os 50 primeiros no ranking IN até dez/2026'"
                rows={2}
                {...register('criterios')}
              />
            </div>
            <div>
              <Label htmlFor="obstaculos">Obstáculos previstos</Label>
              <Textarea
                id="obstaculos"
                placeholder="Tempo limitado, lesões, viagem, finanças..."
                rows={2}
                {...register('obstaculos')}
              />
            </div>
            <div>
              <Label htmlFor="plano">Plano de ação</Label>
              <Textarea
                id="plano"
                placeholder="Treinos semanais, torneios-alvo, recursos necessários..."
                rows={3}
                {...register('plano')}
              />
            </div>

            <p className="text-xs text-muted-foreground flex gap-1 p-2 rounded-md bg-amber-500/10 border border-amber-500/30">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Dica SMART:</strong> Específica, Mensurável, Alcançável, Relevante, com Tempo.
                Ex: &quot;Ser top 100 no ranking IN até 2027-12, ganhando no mínimo 2 torneios estaduais por ano&quot;.
              </span>
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/metas')}>
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
