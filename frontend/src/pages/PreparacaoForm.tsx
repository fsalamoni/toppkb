import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, doc, addDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { ChevronLeft, Save, AlertTriangle, Info } from 'lucide-react';
import { EXERCICIOS, GRUPOS_MUSCULARES, ALERTAS_50_MAIS_GERAIS } from '@/data/seed/exercicios';
import { cn } from '@/lib/utils';

type FormData = {
  data: string;
  tipo: 'forca' | 'mobilidade' | 'cardio' | 'core' | 'aquecimento' | 'alongamento' | 'misto';
  divisao?: string;
  foco?: string;
  duracaoMin: number;
  rpeMedio: number;
  intensidadeMedia?: number;
  intensidadeMax?: number;
  exercicios: string[];
  observacoes: string;
  alertas: string[];
};

const TIPO_OPCOES = [
  { value: 'forca', label: '🏋️ Força', desc: 'Musculação, hipertrofia' },
  { value: 'mobilidade', label: '🤸 Mobilidade', desc: 'Articular, flexibilidade' },
  { value: 'cardio', label: '❤️ Cardio', desc: 'Aeróbico, esteira, bike' },
  { value: 'core', label: '🧱 Core', desc: 'Abdômen, lombar, estabilização' },
  { value: 'alongamento', label: '🧘 Alongamento', desc: 'Pós-treino, recuperação' },
  { value: 'misto', label: '⚡ Misto', desc: 'Combinação de 2+ tipos' },
];

const DIVISOES = [
  { value: 'A', label: 'A — Peito/Ombro/Tri' },
  { value: 'B', label: 'B — Costa/Bi' },
  { value: 'C', label: 'C — Pernas' },
  { value: 'fullbody', label: 'Full body' },
];

const FOCOS_MOBILIDADE = [
  { value: 'geral', label: 'Geral' },
  { value: 'quadril', label: 'Quadril' },
  { value: 'ombro', label: 'Ombro' },
  { value: 'coluna', label: 'Coluna' },
  { value: 'tornozelo', label: 'Tornozelo' },
  { value: 'punho', label: 'Punho' },
];

export function PreparacaoForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const qc = useQueryClient();
  const [exGrupoFiltro, setExGrupoFiltro] = useState<string>('todos');

  const { data: sessaoExistente, isLoading: loading } = useQuery({
    queryKey: ['preparacao-sessao', id],
    queryFn: async (): Promise<any | null> => {
      if (!id || !user) return null;
      const snap = await getDoc(doc(db, 'toppkb_users', user.uid, 'preparacao', id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
    },
    enabled: !!id && !!user,
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      data: new Date().toISOString().slice(0, 16),
      tipo: 'forca',
      duracaoMin: 45,
      rpeMedio: 7,
      exercicios: [],
      observacoes: '',
      alertas: [],
      ...(sessaoExistente || {}),
      ...(sessaoExistente?.data && {
        data: typeof sessaoExistente.data === 'string'
          ? sessaoExistente.data.slice(0, 16)
          : new Date(sessaoExistente.data?.toDate?.() || sessaoExistente.data).toISOString().slice(0, 16)
      }),
    },
  });

  const tipo = watch('tipo');
  
  const _duracao = watch('duracaoMin');
  void _duracao;
  const rpe = watch('rpeMedio');
  const exerciciosMarcados = watch('exercicios') || [];

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Sem usuário');
      const payload = {
        uid: user.uid,
        ...data,
        data: new Date(data.data).toISOString(),
        duracaoMin: Number(data.duracaoMin),
        rpeMedio: Number(data.rpeMedio),
        intensidadeMedia: data.intensidadeMedia ? Number(data.intensidadeMedia) : null,
        intensidadeMax: data.intensidadeMax ? Number(data.intensidadeMax) : null,
        updatedAt: serverTimestamp(),
      };
      if (id) {
        await setDoc(doc(db, 'toppkb_users', user.uid, 'preparacao', id), payload, { merge: true });
        return 'updated' as const;
      } else {
        await addDoc(collection(db, 'toppkb_users', user.uid, 'preparacao'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        return 'created' as const;
      }
    },
    onSuccess: (action) => {
      qc.invalidateQueries({ queryKey: ['preparacao', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(action === 'created' ? 'Sessão registrada! 💪' : 'Sessão atualizada!');
      navigate('/app/preparacao');
    },
    onError: (e: any) => toast.error('Erro: ' + e.message),
  });

  const toggleExercicio = (nome: string) => {
    setValue(
      'exercicios',
      exerciciosMarcados.includes(nome)
        ? exerciciosMarcados.filter((x) => x !== nome)
        : [...exerciciosMarcados, nome]
    );
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const exerciciosFiltrados = exGrupoFiltro === 'todos'
    ? EXERCICIOS
    : EXERCICIOS.filter((e) => e.grupo === exGrupoFiltro);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/preparacao')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
        {/* ============ BÁSICO ============ */}
        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Editar sessão' : 'Nova sessão'}</CardTitle>
            <CardDescription>Força, mobilidade, cardio, core</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="data">Data/hora</Label>
                <Input id="data" type="datetime-local" {...register('data', { required: true })} />
              </div>
              <div>
                <Label htmlFor="duracao">Duração (min)</Label>
                <Input id="duracao" type="number" min="1" step="5" {...register('duracaoMin', { required: true, min: 1 })} />
              </div>
            </div>

            <div>
              <Label>Tipo de sessão</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {TIPO_OPCOES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setValue('tipo', t.value as any)}
                    className={cn(
                      "text-left p-3 rounded-lg border-2 transition",
                      tipo === t.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="font-medium text-sm">{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {tipo === 'forca' && (
              <div>
                <Label>Divisão do treino</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DIVISOES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setValue('divisao', d.value)}
                      className={cn(
                        "text-sm px-3 py-1.5 rounded-md border",
                        watch('divisao') === d.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tipo === 'mobilidade' && (
              <div>
                <Label>Foco da mobilidade</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {FOCOS_MOBILIDADE.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setValue('foco', f.value)}
                      className={cn(
                        "text-sm px-3 py-1.5 rounded-md border",
                        watch('foco') === f.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tipo === 'cardio' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fc-med">FC média (bpm)</Label>
                  <Input id="fc-med" type="number" placeholder="120" {...register('intensidadeMedia')} />
                </div>
                <div>
                  <Label htmlFor="fc-max">FC máx (bpm)</Label>
                  <Input id="fc-max" type="number" placeholder="145" {...register('intensidadeMax')} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============ ESFORÇO ============ */}
        <Card>
          <CardHeader>
            <CardTitle>Esforço</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">RPE médio</Label>
                <span className="text-sm font-semibold tabular-nums">{rpe}/10</span>
              </div>
              <input
                type="range" min="1" max="10"
                value={rpe}
                onChange={(e) => setValue('rpeMedio', Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 (muito leve)</span>
                <span>10 (máximo)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============ EXERCÍCIOS ============ */}
        <Card>
          <CardHeader>
            <CardTitle>Exercícios</CardTitle>
            <CardDescription>Marque os exercícios realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => setExGrupoFiltro('todos')}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border",
                  exGrupoFiltro === 'todos'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border'
                )}
              >
                Todos
              </button>
              {Object.entries(GRUPOS_MUSCULARES).map(([key, g]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setExGrupoFiltro(key)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border",
                    exGrupoFiltro === key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border'
                  )}
                >
                  {g.icone} {g.nome}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {exerciciosFiltrados.map((ex) => {
                const checked = exerciciosMarcados.includes(ex.nome);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => toggleExercicio(ex.nome)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition",
                      checked
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                        checked ? 'border-primary bg-primary text-white' : 'border-gray-300'
                      )}>
                        {checked && '✓'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">{ex.nome}</span>
                          <span className="text-xs text-muted-foreground">
                            {ex.nivel}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ex.focoPrincipal} · {ex.equipamento}
                        </p>
                        {checked && ex.alerta50mais && (
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 flex gap-1">
                            <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            {ex.alerta50mais}
                          </p>
                        )}
                        {checked && ex.dicas.length > 0 && (
                          <details className="mt-1">
                            <summary className="text-xs text-primary cursor-pointer">Ver dicas</summary>
                            <ul className="mt-1 text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                              {ex.dicas.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                          </details>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {exerciciosMarcados.length} exercício{exerciciosMarcados.length === 1 ? '' : 's'} selecionado{exerciciosMarcados.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>

        {/* ============ ALERTAS 50+ ============ */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-500" />
              Diretrizes para atletas 50+
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-xs">
              {ALERTAS_50_MAIS_GERAIS.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-500">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* ============ OBS ============ */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Como se sentiu? Alguma dor? Ajustes para próxima?"
              rows={3}
              {...register('observacoes')}
            />
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/preparacao')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting || saveMutation.isPending ? 'Salvando...' : (id ? 'Atualizar' : 'Salvar sessão')}
          </Button>
        </div>
      </form>
    </div>
  );
}
