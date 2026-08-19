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
import { ChevronLeft, Lightbulb, Save } from 'lucide-react';
import { DRILL_SUGESTOES, DRILL_CATEGORIAS } from '@/data/seed/drill-suggestions.ts';

type FormData = {
  data: string;
  duracaoMin: number;
  tipo: 'tecnico' | 'tatica' | 'fisico' | 'mental' | 'recreativo' | 'competitivo';
  categoria: string;
  local: string;
  comQuem: string;
  intensidade: number;
  rpe: number;
  energia: number;
  drillsRealizados: string[];
  observacoes: string;
  oQueFuncionou: string;
  oQueMelhorar: string;
  proximoFoco: string;
};

const TIPO_OPCOES = [
  { value: 'tecnico', label: '🏓 Técnico', desc: 'Drills, fundamentos' },
  { value: 'tatica', label: '🎯 Tático', desc: 'Estratégia, posicionamento' },
  { value: 'fisico', label: '💪 Físico', desc: 'Força, cardio, mobilidade' },
  { value: 'mental', label: '🧠 Mental', desc: 'Visualização, foco' },
  { value: 'recreativo', label: '🎉 Recreativo', desc: 'Diversão, sem foco competitivo' },
  { value: 'competitivo', label: '🏆 Competitivo', desc: 'Simulado, ranking, prova' },
];

const TIPO_DICA: Record<string, string> = {
  tecnico: 'Inclua pelo menos 1 drill de dink, 1 de terceiro shot e 1 de voleio para uma sessão completa.',
  tatica: 'Trabalhe posicionamento na cozinha e decisão drive vs drop. Registre seus erros táticos.',
  fisico: 'Não esqueça do aquecimento (5-10min) e alongamento (8min). Anote RPE por exercício.',
  mental: 'Visualização funciona melhor em ambiente calmo, 10 min. Anote o que apareceu na mente.',
  recreativo: 'Sem pressão — apenas anote pra ter histórico. Brinque, experimente golpes novos.',
  competitivo: 'Registre placares, adversários, emoções pré/pós. Use pra identificar padrões.',
};

export function TreinoForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const qc = useQueryClient();
  const [drillFiltro, setDrillFiltro] = useState<string>('todas');

  // Se tiver id, é edição
  const { data: treinoExistente, isLoading: loadingTreino } = useQuery({
    queryKey: ['treino', id],
    queryFn: async (): Promise<any | null> => {
      if (!id || !user) return null;
      const snap = await getDoc(doc(db, 'toppkb_users', user.uid, 'treinos', id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
    },
    enabled: !!id && !!user,
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      data: new Date().toISOString().slice(0, 16),
      duracaoMin: 60,
      tipo: 'tecnico',
      categoria: 'pickleball',
      local: '',
      comQuem: '',
      intensidade: 7,
      rpe: 7,
      energia: 7,
      drillsRealizados: [],
      observacoes: '',
      oQueFuncionou: '',
      oQueMelhorar: '',
      proximoFoco: '',
      ...(treinoExistente || {}),
      // formata data se existe
      ...(treinoExistente?.data && {
        data: typeof treinoExistente.data === 'string'
          ? treinoExistente.data.slice(0, 16)
          : new Date(treinoExistente.data?.toDate?.() || treinoExistente.data).toISOString().slice(0, 16)
      }),
    },
  });

  const tipo = watch('tipo');
  const intensidade = watch('intensidade');
  const rpe = watch('rpe');
  const energia = watch('energia');
  const drillsMarcados = watch('drillsRealizados') || [];

  const toggleDrill = (drillNome: string) => {
    setValue(
      'drillsRealizados',
      drillsMarcados.includes(drillNome)
        ? drillsMarcados.filter((x) => x !== drillNome)
        : [...drillsMarcados, drillNome],
    );
  };

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Sem usuário');
      const payload = {
        uid: user.uid,
        ...data,
        data: new Date(data.data).toISOString(),
        duracaoMin: Number(data.duracaoMin),
        intensidade: Number(data.intensidade),
        rpe: Number(data.rpe),
        energia: Number(data.energia),
        updatedAt: serverTimestamp(),
      };
      if (id) {
        await setDoc(doc(db, 'toppkb_users', user.uid, 'treinos', id), payload, { merge: true });
        return { id, action: 'updated' as const };
      } else {
        const ref = await addDoc(collection(db, 'toppkb_users', user.uid, 'treinos'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        return { id: ref.id, action: 'created' as const };
      }
    },
    onSuccess: ({ action }) => {
      qc.invalidateQueries({ queryKey: ['treinos', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(action === 'created' ? 'Treino registrado! 💪' : 'Treino atualizado!');
      navigate('/app/treinos');
    },
    onError: (e: any) => toast.error('Erro: ' + e.message),
  });

  const onSubmit = (data: FormData) => saveMutation.mutate(data);

  if (loadingTreino) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // Drills filtrados por categoria
  const drillsFiltrados = drillFiltro === 'todas'
    ? DRILL_SUGESTOES
    : DRILL_SUGESTOES.filter((d) => d.categoria === drillFiltro);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/treinos')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ============ BÁSICO ============ */}
        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Editar treino' : 'Novo treino'}</CardTitle>
            <CardDescription>Registre sua sessão para acompanhar evolução</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Data + Duração */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="data">Data e hora</Label>
                <Input id="data" type="datetime-local" {...register('data', { required: true })} />
              </div>
              <div>
                <Label htmlFor="duracao">Duração (min)</Label>
                <Input
                  id="duracao"
                  type="number"
                  min="1"
                  step="5"
                  {...register('duracaoMin', { required: true, min: 1 })}
                />
              </div>
            </div>

            {/* Tipo (cards visuais) */}
            <div>
              <Label>Tipo de treino</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {TIPO_OPCOES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setValue('tipo', t.value as any)}
                    className={`text-left p-3 rounded-lg border-2 transition ${
                      tipo === t.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="font-medium text-sm">{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
              {TIPO_DICA[tipo] && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">{TIPO_DICA[tipo]}</p>
                </div>
              )}
            </div>

            {/* Local + Parceiros */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="local">Local</Label>
                <Input id="local" placeholder="Clube A, Praça X..." {...register('local')} />
              </div>
              <div>
                <Label htmlFor="comQuem">Com quem</Label>
                <Input
                  id="comQuem"
                  placeholder="Amigos, coach..."
                  {...register('comQuem')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============ INTENSIDADE / RPE / ENERGIA ============ */}
        <Card>
          <CardHeader>
            <CardTitle>Esforço percebido</CardTitle>
            <CardDescription>Use 1-10 em cada (1 = muito leve, 10 = máximo)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Slider label="Intensidade" value={intensidade} onChange={(v) => setValue('intensidade', v)} />
            <Slider label="RPE (esforço geral)" value={rpe} onChange={(v) => setValue('rpe', v)} />
            <Slider label="Energia percebida" value={energia} onChange={(v) => setValue('energia', v)} />
          </CardContent>
        </Card>

        {/* ============ DRILLS ============ */}
        <Card>
          <CardHeader>
            <CardTitle>Drills realizados</CardTitle>
            <CardDescription>Marque os drills que você fez nesta sessão</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtro por categoria */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => setDrillFiltro('todas')}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  drillFiltro === 'todas'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border'
                }`}
              >
                Todas
              </button>
              {DRILL_CATEGORIAS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDrillFiltro(c.id as string)}
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    drillFiltro === c.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border'
                  }`}
                >
                  {c.icone} {c.nome}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {drillsFiltrados.map((d) => {
                const checked = drillsMarcados.includes(d.nome);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDrill(d.nome)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      checked
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-border hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300'
                      }`}>
                        {checked && '✓'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">{d.nome}</span>
                          <span className="text-xs text-muted-foreground">
                            ~{d.duracaoEstimadaMin}min · {d.dificuldade}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{d.focoPrincipal}</p>
                        {checked && (
                          <details className="mt-1">
                            <summary className="text-xs text-emerald-600 dark:text-emerald-400 cursor-pointer">
                              Ver dicas
                            </summary>
                            <ul className="mt-1 text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                              {d.dicas.map((tip, i) => <li key={i}>{tip}</li>)}
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
              {drillsMarcados.length} drill{drillsMarcados.length === 1 ? '' : 's'} selecionado{drillsMarcados.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>

        {/* ============ REFLEXÃO ============ */}
        <Card>
          <CardHeader>
            <CardTitle>Reflexão</CardTitle>
            <CardDescription>Anotar o que funciona e o que melhorar acelera evolução</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="funcionou">O que funcionou bem?</Label>
              <Textarea
                id="funcionou"
                placeholder="Dink consistente, voleio firme, leitura de jogo..."
                rows={2}
                {...register('oQueFuncionou')}
              />
            </div>
            <div>
              <Label htmlFor="melhorar">O que melhorar?</Label>
              <Textarea
                id="melhorar"
                placeholder="Mais volume no 3rd shot drop, menos erro não forçado..."
                rows={2}
                {...register('oQueMelhorar')}
              />
            </div>
            <div>
              <Label htmlFor="proximo">Próximo foco</Label>
              <Input
                id="proximo"
                placeholder="Ex: cross-court dink 100 reps"
                {...register('proximoFoco')}
              />
            </div>
            <div>
              <Label htmlFor="obs">Observações livres</Label>
              <Textarea
                id="obs"
                placeholder="Lesão no joelho esquerdo no final, clima, alimentação..."
                rows={2}
                {...register('observacoes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* ============ AÇÕES ============ */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/treinos')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting || saveMutation.isPending ? 'Salvando...' : (id ? 'Atualizar treino' : 'Salvar treino')}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-semibold tabular-nums">{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-500"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>1 (muito leve)</span>
        <span>5 (moderado)</span>
        <span>10 (máximo)</span>
      </div>
    </div>
  );
}
