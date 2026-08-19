import { useState, useMemo } from 'react';
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
import { ChevronLeft, Save, Search, X } from 'lucide-react';
import { ALIMENTOS, CATEGORIAS_ALIMENTO, Alimento } from '@/data/seed/alimentos';
import { cn } from '@/lib/utils';

type RefeicaoTipo = 'cafe-da-manha' | 'lanche-manha' | 'almoco' | 'lanche-tarde' | 'jantar' | 'ceia' | 'pre-treino' | 'pos-treino';

type FormData = {
  data: string;
  tipo: RefeicaoTipo;
  alimentos: { nome: string; gramas: number; kcal: number; proteina: number; carboidrato: number; gordura: number }[];
  observacoes: string;
  fomeNivel: number;       // 1-5
  saciedadeNivel: number;  // 1-5 (pós-refeição)
};

const TIPO_OPCOES: { value: RefeicaoTipo; label: string; icone: string }[] = [
  { value: 'cafe-da-manha', label: 'Café da manhã', icone: '☕' },
  { value: 'lanche-manha', label: 'Lanche da manhã', icone: '🍎' },
  { value: 'almoco', label: 'Almoço', icone: '🍽️' },
  { value: 'lanche-tarde', label: 'Lanche da tarde', icone: '🥪' },
  { value: 'jantar', label: 'Jantar', icone: '🌙' },
  { value: 'ceia', label: 'Ceia', icone: '🌜' },
  { value: 'pre-treino', label: 'Pré-treino', icone: '🏓' },
  { value: 'pos-treino', label: 'Pós-treino', icone: '💪' },
];

export function NutricaoForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const qc = useQueryClient();
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');

  const { data: refeicaoExistente, isLoading: loading } = useQuery({
    queryKey: ['nutricao', id],
    queryFn: async (): Promise<any | null> => {
      if (!id || !user) return null;
      const snap = await getDoc(doc(db, 'toppkb_users', user.uid, 'nutricao', id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
    },
    enabled: !!id && !!user,
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      data: new Date().toISOString().slice(0, 16),
      tipo: 'almoco',
      alimentos: [],
      observacoes: '',
      fomeNivel: 3,
      saciedadeNivel: 3,
      ...(refeicaoExistente || {}),
      ...(refeicaoExistente?.data && {
        data: typeof refeicaoExistente.data === 'string'
          ? refeicaoExistente.data.slice(0, 16)
          : new Date(refeicaoExistente.data?.toDate?.() || refeicaoExistente.data).toISOString().slice(0, 16)
      }),
    },
  });

  const tipo = watch('tipo');
  const fome = watch('fomeNivel');
  const saciedade = watch('saciedadeNivel');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const alimentos = useMemo(() => watch('alimentos') || [], [tipo, fome, saciedade]);

  // Cálculo de totais
  const totais = useMemo(() => {
    return alimentos.reduce(
      (acc, a) => ({
        kcal: acc.kcal + a.kcal,
        proteina: acc.proteina + a.proteina,
        carboidrato: acc.carboidrato + a.carboidrato,
        gordura: acc.gordura + a.gordura,
      }),
      { kcal: 0, proteina: 0, carboidrato: 0, gordura: 0 }
    );
  }, [alimentos]);

  // Filtragem do banco
  const alimentosFiltrados = useMemo(() => {
    const lower = busca.toLowerCase().trim();
    return ALIMENTOS.filter((a) => {
      if (categoriaFiltro !== 'todas' && a.categoria !== categoriaFiltro) return false;
      if (!lower) return true;
      return (
        a.nome.toLowerCase().includes(lower) ||
        a.busca.some((b) => b.toLowerCase().includes(lower))
      );
    });
  }, [busca, categoriaFiltro]);

  const adicionarAlimento = (alimento: Alimento) => {
    const novo = {
      nome: alimento.nome,
      gramas: alimento.porcaoGramas,
      kcal: Math.round((alimento.kcal * alimento.porcaoGramas) / 100),
      proteina: Math.round((alimento.proteina * alimento.porcaoGramas) / 100 * 10) / 10,
      carboidrato: Math.round((alimento.carboidrato * alimento.porcaoGramas) / 100 * 10) / 10,
      gordura: Math.round((alimento.gordura * alimento.porcaoGramas) / 100 * 10) / 10,
    };
    setValue('alimentos', [...alimentos, novo]);
  };

  const removerAlimento = (idx: number) => {
    setValue('alimentos', alimentos.filter((_, i) => i !== idx));
  };

  const atualizarGramas = (idx: number, gramas: number) => {
    const alim = ALIMENTOS.find((a) => a.nome === alimentos[idx].nome);
    if (!alim) return;
    const novo = {
      ...alimentos[idx],
      gramas,
      kcal: Math.round((alim.kcal * gramas) / 100),
      proteina: Math.round((alim.proteina * gramas) / 100 * 10) / 10,
      carboidrato: Math.round((alim.carboidrato * gramas) / 100 * 10) / 10,
      gordura: Math.round((alim.gordura * gramas) / 100 * 10) / 10,
    };
    const copia = [...alimentos];
    copia[idx] = novo;
    setValue('alimentos', copia);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Sem usuário');
      const payload = {
        uid: user.uid,
        ...data,
        data: new Date(data.data).toISOString(),
        fomeNivel: Number(data.fomeNivel),
        saciedadeNivel: Number(data.saciedadeNivel),
        totais,
        updatedAt: serverTimestamp(),
      };
      if (id) {
        await setDoc(doc(db, 'toppkb_users', user.uid, 'nutricao', id), payload, { merge: true });
        return 'updated' as const;
      } else {
        await addDoc(collection(db, 'toppkb_users', user.uid, 'nutricao'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        return 'created' as const;
      }
    },
    onSuccess: (action) => {
      qc.invalidateQueries({ queryKey: ['nutricao', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(action === 'created' ? 'Refeição registrada! 🥗' : 'Refeição atualizada!');
      navigate('/app/nutricao');
    },
    onError: (e: any) => toast.error('Erro: ' + e.message),
  });

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/nutricao')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
        {/* ============ TIPO E HORA ============ */}
        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Editar refeição' : 'Nova refeição'}</CardTitle>
            <CardDescription>Registre tudo o que comeu/bebeu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="data">Data/hora</Label>
                <Input id="data" type="datetime-local" {...register('data', { required: true })} />
              </div>
              <div>
                <Label>Tipo</Label>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {TIPO_OPCOES.slice(0, 8).map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setValue('tipo', t.value)}
                      className={cn(
                        "text-xs px-2 py-2 rounded-md border flex flex-col items-center gap-0.5",
                        tipo === t.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <span className="text-base">{t.icone}</span>
                      <span className="text-[10px]">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============ ALIMENTOS ADICIONADOS ============ */}
        <Card>
          <CardHeader>
            <CardTitle>Alimentos da refeição</CardTitle>
            <CardDescription>
              {alimentos.length} alimento{alimentos.length === 1 ? '' : 's'} · {Math.round(totais.kcal)} kcal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alimentos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum alimento adicionado. Use a busca abaixo.
              </p>
            ) : (
              <div className="space-y-2">
                {alimentos.map((a, i) => {
                  const alim = ALIMENTOS.find((x) => x.nome === a.nome);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-md border border-border bg-card"
                    >
                      <span className="text-xl">
                        {CATEGORIAS_ALIMENTO[alim?.categoria || 'outro']?.icone || '🍽️'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{a.nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.kcal} kcal · {a.proteina}P · {a.carboidrato}C · {a.gordura}G
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="1"
                          step="5"
                          value={a.gramas}
                          onChange={(e) => atualizarGramas(i, Number(e.target.value))}
                          className="w-20 h-8 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">g</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removerAlimento(i)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Totais */}
                <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/30">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.round(totais.kcal)}
                      </div>
                      <div className="text-xs text-muted-foreground">kcal</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {totais.proteina.toFixed(1)}g
                      </div>
                      <div className="text-xs text-muted-foreground">Proteína</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {totais.carboidrato.toFixed(1)}g
                      </div>
                      <div className="text-xs text-muted-foreground">Carb</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                        {totais.gordura.toFixed(1)}g
                      </div>
                      <div className="text-xs text-muted-foreground">Gord</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============ BUSCA NO BANCO ============ */}
        {alimentos.length < 30 && (
          <Card>
            <CardHeader>
              <CardTitle>Adicionar alimentos</CardTitle>
              <CardDescription>Banco com {ALIMENTOS.length} alimentos brasileiros</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtro por categoria */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => setCategoriaFiltro('todas')}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border",
                    categoriaFiltro === 'todas'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border'
                  )}
                >
                  Todas
                </button>
                {Object.entries(CATEGORIAS_ALIMENTO).map(([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategoriaFiltro(key)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border",
                      categoriaFiltro === key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border'
                    )}
                  >
                    {cat.icone} {cat.nome}
                  </button>
                ))}
              </div>

              {/* Busca */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar alimento..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Resultados */}
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {alimentosFiltrados.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum alimento encontrado. Adicione manualmente no campo "alimentos" após salvar.
                  </p>
                ) : (
                  alimentosFiltrados.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => adicionarAlimento(a)}
                      className="w-full text-left p-2 rounded-md border border-border hover:border-primary/50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{CATEGORIAS_ALIMENTO[a.categoria]?.icone || '🍽️'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{a.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.porcaoComum} ({a.porcaoGramas}g) · {Math.round((a.kcal * a.porcaoGramas) / 100)} kcal · {Math.round((a.proteina * a.porcaoGramas) / 100)}g prot
                          </div>
                        </div>
                        <span className="text-xs text-primary">+ Adicionar</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============ FOME / SACIEDADE ============ */}
        <Card>
          <CardHeader>
            <CardTitle>Como foi a refeição?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">Nível de fome (antes)</Label>
                <span className="text-sm font-semibold">{fome}/5</span>
              </div>
              <input
                type="range" min="1" max="5"
                value={fome}
                onChange={(e) => setValue('fomeNivel', Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 (sem fome)</span>
                <span>5 (morrendo de fome)</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">Saciedade (depois)</Label>
                <span className="text-sm font-semibold">{saciedade}/5</span>
              </div>
              <input
                type="range" min="1" max="5"
                value={saciedade}
                onChange={(e) => setValue('saciedadeNivel', Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 (continuo com fome)</span>
                <span>5 (muito satisfeito)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============ OBS ============ */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Com quem comeu? Onde? Como se sentiu?"
              rows={2}
              {...register('observacoes')}
            />
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/nutricao')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting || saveMutation.isPending ? 'Salvando...' : (id ? 'Atualizar' : 'Salvar refeição')}
          </Button>
        </div>
      </form>
    </div>
  );
}
