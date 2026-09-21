/**
 * 🏋️ Treinamento · Meu Programa (v2 — produção final)
 *
 * Hub único de planejamento + execução de treinos no tempo:
 *
 *   1. SETUP — Define objetivo + rotina + equipamento + nível → gera plano
 *   2. PLANO — Visão semana-a-semana (navega por semana, deload visível)
 *   3. EXECUTAR — Próximas sessões pendentes da semana atual
 *      • Botão "✓ Marcar como feita" inline (rápido, sem abrir form)
 *      • Botão "Executar com detalhes" (abre form completo + Cronômetro)
 *      • Mostra próxima sessão pendente em destaque
 *      • Countdown pro próximo treino
 *   4. PROGRESSO — Stats reais de aderência
 *      • 4 KPIs (aderência, feitas, total, % concluído)
 *      • Calendário do plano (heatmap de aderência por dia)
 *      • Streak (dias consecutivos)
 *      • Gráfico de aderência por semana
 *
 * Sub-rota: /app/treinamento/meu-programa
 *
 * Firestore: toppkb_users/{uid}/treinamento/programa (doc "atual")
 * localStorage: treinamento-programa (cache)
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection, doc, getDoc, setDoc, addDoc, getDocs, query, serverTimestamp, orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Confetti } from '@/components/Confetti';
import {
  ChevronLeft, Target, Calendar, Activity, ChevronRight,
  Check, Sparkles, Dumbbell, Trophy, Trash2,
  AlertCircle, TrendingUp, Clock, Play, Flame,
  Download, Copy,
} from 'lucide-react';
import {
  gerarPlano, OBJETIVOS_LABEL, OBJETIVOS_ICONE,
  type Plano, type Objetivo, type Nivel, type Equipamento, type SessaoPlano,
  type PlanoInput,
} from '@/lib/geradorPlano';

const STORAGE_KEY = 'treinamento-programa';

type Tab = 'setup' | 'plano' | 'executar' | 'progresso';

// ─────────────────────────────────────────────────────────────
//   COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export function TreinamentoMeuPrograma() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('setup');
  const [showConfetti, setShowConfetti] = useState(false);

  // Plano ativo
  const { data: plano, isLoading: loadingPlano } = useQuery({
    queryKey: ['treinamento-programa', user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const ref = doc(db, 'toppkb_users', user.uid, 'treinamento', 'programa', 'atual');
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data() as Plano;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored) as Plano;
      } catch {
        /* ignore */
      }
      return null;
    },
    enabled: !!user,
  });

  // Salvar plano
  const savePlano = useMutation({
    mutationFn: async (novoPlano: Plano) => {
      if (!user) throw new Error('Não autenticado');
      const ref = doc(db, 'toppkb_users', user.uid, 'treinamento', 'programa', 'atual');
      await setDoc(ref, { ...novoPlano, savedAt: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novoPlano));
      return novoPlano;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['treinamento-programa'] });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      toast({
        title: 'Programa criado! 🎉',
        description: 'Vamos começar a seguir. Vamos pra aba Executar.',
        variant: 'success',
      });
      setTab('executar');
    },
    onError: (e: Error) => {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    },
  });

  // Sessões executadas (com listener reactivo)
  const { data: sessoes } = useQuery({
    queryKey: ['treinamento-sessoes-para-plano', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'treinamento', 'sessoes'),
        orderBy('data', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  // Marcar como feita (rápido - cria sessão minimal)
  const marcarFeita = useMutation({
    mutationFn: async (s: SessaoPlano) => {
      if (!user || !plano) throw new Error('Erro');
      const docRef = await addDoc(
        collection(db, 'toppkb_users', user.uid, 'treinamento', 'sessoes'),
        {
          titulo: `${s.nome} (Sem ${s.semanaIdx + 1}${s.tipo})`,
          data: new Date().toISOString(),
          tipo: 'kettlebell',
          duracaoMin: s.duracaoMin,
          planoSessaoId: s.id,
          planoId: plano.id,
          exercicios: s.exercicios.map((ex) => ({
            nome: ex.nome,
            series: ex.series,
            reps: ex.reps,
            carga: ex.carga,
            descansoSeg: ex.descansoSeg,
            feito: true,
          })),
          origem: 'meu-programa',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      );
      return docRef.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['treinamento-sessoes-para-plano'] });
      toast({ title: 'Sessão marcada como feita! ✅', variant: 'success' });
    },
    onError: (e: Error) => {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    },
  });

  // Auto-pula para "executar" se já tem plano
  useEffect(() => {
    if (plano && tab === 'setup') {
      setTab('executar');
    }
  }, [plano]); // eslint-disable-line

  if (loadingPlano) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  const handleApagar = async () => {
    if (!plano) return;
    if (!confirm(`Apagar programa "${plano.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      if (user) {
        await setDoc(
          doc(db, 'toppkb_users', user.uid, 'treinamento', 'programa', 'atual'),
          {},
        );
      }
      localStorage.removeItem(STORAGE_KEY);
      qc.invalidateQueries({ queryKey: ['treinamento-programa'] });
      setTab('setup');
      toast({ title: 'Programa removido', description: 'Crie um novo quando quiser.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const handleExportar = () => {
    if (!plano) return;
    const txt = exportarPlanoTexto(plano);
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plano.nome.replace(/[^a-zA-Z0-9-_]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Programa exportado!', description: 'Arquivo .txt baixado.' });
  };

  const handleCopiar = () => {
    if (!plano) return;
    const txt = exportarPlanoTexto(plano);
    navigator.clipboard.writeText(txt).then(() => {
      toast({ title: 'Copiado!', description: 'Plano na área de transferência.' });
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Confetti trigger={showConfetti} />

      {/* HEADER */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/app/treinamento">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Treinamento
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-amber-400" />
          Meu Programa
        </h1>
        <p className="text-muted-foreground mt-1">
          Defina objetivo + tempo → gere o plano → siga e registre sessão por sessão.
        </p>
      </div>

      {/* PLANO ATIVO (resumo) */}
      {plano && (
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{OBJETIVOS_ICONE[plano.objetivo]}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-lg truncate">{plano.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {OBJETIVOS_LABEL[plano.objetivo]} · {plano.duracaoSemanas}sem · {plano.sessoesPorSemana}×/sem · {plano.duracaoSessaoMin}min
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                <Button size="sm" variant="outline" onClick={handleCopiar} title="Copiar como texto">
                  <Copy className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportar} title="Baixar .txt">
                  <Download className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTab('setup')}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Novo
                </Button>
                <Button size="sm" variant="ghost" onClick={handleApagar} title="Apagar programa">
                  <Trash2 className="h-3 w-3 text-rose-400" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ABAS */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        <TabButton current={tab} value="setup" onClick={setTab} icon={Target} label="Setup" />
        <TabButton current={tab} value="plano" onClick={setTab} icon={Calendar} label="Plano" disabled={!plano} />
        <TabButton current={tab} value="executar" onClick={setTab} icon={Activity} label="Executar" disabled={!plano} badge={(sessoes || []).filter((sf) => plano && plano.sessoes.some((ps) => ps.id === sf.planoSessaoId)).length > 0 ? String((sessoes || []).filter((sf) => plano && plano.sessoes.some((ps) => ps.id === sf.planoSessaoId)).length) : undefined} />
        <TabButton current={tab} value="progresso" onClick={setTab} icon={TrendingUp} label="Progresso" disabled={!plano} />
      </div>

      {/* CONTEÚDO */}
      {tab === 'setup' && (
        <SetupTab
          onCriar={(p) => {
            savePlano.mutate(p);
          }}
          saving={savePlano.isPending}
        />
      )}

      {tab === 'plano' && plano && (
        <PlanoTab
          plano={plano}
          sessoesFeitas={sessoes || []}
          onExecutar={(s) => {
            localStorage.setItem('treinamento-sessao-pendente', JSON.stringify(s));
            navigate('/app/treinamento/sessoes/nova?planoId=' + encodeURIComponent(s.id));
          }}
          onMarcarFeita={(s) => marcarFeita.mutate(s)}
          marcando={marcarFeita.isPending}
        />
      )}

      {tab === 'executar' && plano && (
        <ExecutarTab
          plano={plano}
          sessoesFeitas={sessoes || []}
          onExecutar={(s) => {
            localStorage.setItem('treinamento-sessao-pendente', JSON.stringify(s));
            navigate('/app/treinamento/sessoes/nova?planoId=' + encodeURIComponent(s.id));
          }}
          onMarcarFeita={(s) => marcarFeita.mutate(s)}
          marcando={marcarFeita.isPending}
        />
      )}

      {tab === 'progresso' && plano && (
        <ProgressoTab plano={plano} sessoesFeitas={sessoes || []} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//   ABA: SETUP (4 passos + revisão)
// ─────────────────────────────────────────────────────────────

function SetupTab({ onCriar, saving }: {
  onCriar: (p: Plano) => void;
  saving: boolean;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PlanoInput>({
    nome: '',
    objetivo: 'forca_geral',
    nivel: 'iniciante',
    equipamento: 'kb_completo',
    duracaoSemanas: 12,
    sessoesPorSemana: 3,
    duracaoSessaoMin: 45,
  });

  const objetivos: Objetivo[] = ['forca_geral', 'hipertrofia', 'perda_peso', 'mobilidade', 'condicionamento', 'pickleball'];
  const niveis: Nivel[] = ['iniciante', 'intermediario', 'avancado'];
  const equipamentos: Equipamento[] = ['kb_leve', 'kb_completo', 'peso_corporal', 'academia_completa'];

  // Pré-visualização ao vivo
  const preview = useMemo(() => {
    try {
      return gerarPlano(form);
    } catch {
      return null;
    }
  }, [form]);

  const isStepValid = useMemo(() => {
    if (step === 1) return !!form.objetivo;
    if (step === 2) return form.sessoesPorSemana >= 2 && form.duracaoSessaoMin >= 20 && form.duracaoSemanas >= 4;
    if (step === 3) return !!form.nivel && !!form.equipamento;
    return true;
  }, [step, form]);

  return (
    <div className="space-y-4">
      {/* STEPPER */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              step >= n ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
            } ${step === n ? 'ring-2 ring-emerald-300 ring-offset-2 ring-offset-background' : ''}`}>
              {step > n ? <Check className="h-4 w-4" /> : n}
            </div>
            <span className={`hidden sm:inline ${step === n ? 'text-foreground font-medium' : ''}`}>
              {['Objetivo', 'Rotina', 'Equipamento', 'Revisar'][n - 1]}
            </span>
            {n < 4 && <ChevronRight className="h-3 w-3" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-400" />
              Qual é o seu objetivo principal?
            </CardTitle>
            <CardDescription>
              Vamos estruturar seu plano em torno disso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {objetivos.map((obj) => (
                <button
                  key={obj}
                  onClick={() => setForm({ ...form, objetivo: obj })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    form.objetivo === obj
                      ? 'bg-amber-500/20 border-amber-500/50'
                      : 'bg-muted/30 border-border hover:border-amber-500/30'
                  }`}
                >
                  <div className="text-2xl mb-1">{OBJETIVOS_ICONE[obj]}</div>
                  <div className="font-semibold text-sm">{OBJETIVOS_LABEL[obj]}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Quanto tempo você tem?
            </CardTitle>
            <CardDescription>
              Frequência semanal + duração por sessão + duração total do plano.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Frequência semanal: <span className="text-blue-400 font-bold">{form.sessoesPorSemana}× por semana</span></Label>
              <input
                type="range"
                min="2"
                max="6"
                value={form.sessoesPorSemana}
                onChange={(e) => setForm({ ...form, sessoesPorSemana: Number(e.target.value) })}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2× (mínimo)</span>
                <span>3× (recomendado)</span>
                <span>6× (avançado)</span>
              </div>
            </div>

            <div>
              <Label>Duração por sessão: <span className="text-blue-400 font-bold">{form.duracaoSessaoMin} min</span></Label>
              <input
                type="range"
                min="20"
                max="90"
                step="5"
                value={form.duracaoSessaoMin}
                onChange={(e) => setForm({ ...form, duracaoSessaoMin: Number(e.target.value) })}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>20min (curto)</span>
                <span>45min (padrão)</span>
                <span>90min (longo)</span>
              </div>
            </div>

            <div>
              <Label>Duração total do plano: <span className="text-blue-400 font-bold">{form.duracaoSemanas} semanas</span></Label>
              <input
                type="range"
                min="4"
                max="24"
                step="2"
                value={form.duracaoSemanas}
                onChange={(e) => setForm({ ...form, duracaoSemanas: Number(e.target.value) })}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>4sem (curto)</span>
                <span>12sem (padrão)</span>
                <span>24sem (longo)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-purple-400" />
              Equipamento e nível
            </CardTitle>
            <CardDescription>
              O que você tem disponível e qual sua experiência.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Equipamento disponível</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {equipamentos.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => setForm({ ...form, equipamento: eq })}
                    className={`p-3 rounded-lg border-2 text-xs transition-colors ${
                      form.equipamento === eq
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-muted/30 border-border hover:border-purple-500/30'
                    }`}
                  >
                    <div className="font-semibold">
                      {eq === 'kb_leve' && '🏋️ KB leve'}
                      {eq === 'kb_completo' && '🏋️ KB completo'}
                      {eq === 'peso_corporal' && '🤸 Peso corporal'}
                      {eq === 'academia_completa' && '🏢 Academia'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Nível</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {niveis.map((n) => (
                  <button
                    key={n}
                    onClick={() => setForm({ ...form, nivel: n })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      form.nivel === n
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-muted/30 border-border hover:border-purple-500/30'
                    }`}
                  >
                    {n === 'iniciante' && '🌱 Iniciante'}
                    {n === 'intermediario' && '⚡ Intermediário'}
                    {n === 'avancado' && '🏆 Avançado'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="nome">Nome do programa (opcional)</Label>
              <Input
                id="nome"
                placeholder={`Ex: ${OBJETIVOS_LABEL[form.objetivo]} 2025`}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              Pronto! Revise seu programa
            </CardTitle>
            <CardDescription>
              Confira antes de criar. Você pode ajustar depois editando sessões individuais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Objetivo" value={OBJETIVOS_LABEL[form.objetivo]} />
              <Stat label="Frequência" value={`${form.sessoesPorSemana}× / semana`} />
              <Stat label="Por sessão" value={`${form.duracaoSessaoMin} min`} />
              <Stat label="Total" value={`${form.duracaoSemanas} semanas`} />
              <Stat label="Nível" value={form.nivel} />
              <Stat label="Equipamento" value={form.equipamento.replace('_', ' ')} />
              <Stat label="Total de sessões" value={String(preview.sessoes.length)} />
              <Stat label="Tempo total" value={`${Math.round((preview.sessoes.length * form.duracaoSessaoMin) / 60)}h`} />
            </div>

            <div className="border border-border rounded-lg p-3 bg-muted/30">
              <div className="text-sm font-semibold mb-2">📋 Prévia das primeiras 6 sessões</div>
              <div className="space-y-2">
                {preview.sessoes.slice(0, 6).map((s) => {
                  const isDeload = s.semanaIdx % 4 === 3;
                  return (
                    <div key={s.id} className="text-xs flex items-center gap-2">
                      <Badge variant="outline">Sem {s.semanaIdx + 1}</Badge>
                      <Badge variant="outline">{s.tipo}</Badge>
                      {isDeload && <Badge variant="outline" className="text-amber-400 border-amber-500/30">🛌 Deload</Badge>}
                      <span className="flex-1 truncate">{s.nome}</span>
                      <span className="text-muted-foreground">{s.duracaoMin}min</span>
                    </div>
                  );
                })}
                {preview.sessoes.length > 6 && (
                  <div className="text-xs text-muted-foreground">
                    + {preview.sessoes.length - 6} sessões no total...
                  </div>
                )}
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={saving}
              onClick={() => onCriar(preview)}
            >
              <Check className="h-4 w-4 mr-1" />
              {saving ? 'Criando...' : 'Criar e começar programa'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* NAVEGAÇÃO ENTRE STEPS */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
          ← Voltar
        </Button>
        {step < 4 && (
          <Button onClick={() => isStepValid && setStep(Math.min(4, step + 1))} disabled={!isStepValid}>
            Próximo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-semibold text-sm capitalize">{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//   ABA: PLANO (semana-a-semana)
// ─────────────────────────────────────────────────────────────

function PlanoTab({ plano, sessoesFeitas, onExecutar, onMarcarFeita, marcando }: {
  plano: Plano;
  sessoesFeitas: any[];
  onExecutar: (s: SessaoPlano) => void;
  onMarcarFeita: (s: SessaoPlano) => void;
  marcando: boolean;
}) {
  const [semanaAtual, setSemanaAtual] = useState(0);

  // Auto-posiciona na semana atual baseado em dias
  useEffect(() => {
    const inicio = new Date(plano.criadoEm);
    const dias = Math.floor((Date.now() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    const sem = Math.min(plano.duracaoSemanas - 1, Math.max(0, Math.floor(dias / 7)));
    setSemanaAtual(sem);
  }, [plano.criadoEm, plano.duracaoSemanas]);

  const sessoesDaSemana = plano.sessoes.filter((s) => s.semanaIdx === semanaAtual);
  const isDeload = semanaAtual % 4 === 3;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemanaAtual(Math.max(0, semanaAtual - 1))}
              disabled={semanaAtual === 0}
            >
              ← Semana
            </Button>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Semana</div>
              <div className="text-2xl font-bold">{semanaAtual + 1} / {plano.duracaoSemanas}</div>
              {isDeload && (
                <Badge variant="outline" className="mt-1 text-amber-400 border-amber-500/30">
                  🛌 Deload
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemanaAtual(Math.min(plano.duracaoSemanas - 1, semanaAtual + 1))}
              disabled={semanaAtual === plano.duracaoSemanas - 1}
            >
              Semana →
            </Button>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: plano.duracaoSemanas }).map((_, i) => {
              const sessoesFeitasNaSemana = plano.sessoes
                .filter((s) => s.semanaIdx === i)
                .filter((s) => sessoesFeitas.some((sf) => sf.planoSessaoId === s.id)).length;
              const isAtual = i === semanaAtual;
              return (
                <button
                  key={i}
                  onClick={() => setSemanaAtual(i)}
                  className={`h-3 flex-1 rounded transition-colors ${
                    isAtual ? 'ring-2 ring-emerald-300' : ''
                  } ${
                    sessoesFeitasNaSemana > 0 ? 'bg-emerald-500' :
                    i === semanaAtual ? 'bg-emerald-700' :
                    i < semanaAtual ? 'bg-muted-foreground/30' :
                    i % 4 === 3 ? 'bg-amber-700/30' :
                    'bg-muted'
                  }`}
                  title={`Semana ${i + 1}${i % 4 === 3 ? ' (deload)' : ''} · ${sessoesFeitasNaSemana} feitas`}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sessoesDaSemana.map((s) => {
          const feita = sessoesFeitas.some((sf) => sf.planoSessaoId === s.id);
          const numFeitas = sessoesFeitas.filter((sf) => sf.planoSessaoId === s.id).length;
          return (
            <Card key={s.id} className={feita ? 'border-emerald-500/50 bg-emerald-500/5' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{s.tipo}</Badge>
                  <div className="flex items-center gap-1">
                    {feita && <Check className="h-4 w-4 text-emerald-400" />}
                    {numFeitas > 1 && (
                      <Badge variant="outline" className="text-xs">×{numFeitas}</Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-base">{s.nome}</CardTitle>
                <CardDescription className="text-xs">{s.foco} · {s.duracaoMin}min</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 mb-3">
                  {s.exercicios.slice(0, 4).map((ex, i) => (
                    <div key={i} className="text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="flex-1 truncate">{ex.nome}</span>
                      <span className="text-muted-foreground">{ex.series}×{ex.reps}</span>
                    </div>
                  ))}
                  {s.exercicios.length > 4 && (
                    <div className="text-xs text-muted-foreground">+{s.exercicios.length - 4} exercícios</div>
                  )}
                </div>
                <div className="flex gap-1">
                  {!feita && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onMarcarFeita(s)}
                      disabled={marcando}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      {marcando ? '...' : 'Feita'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="flex-1"
                    variant={feita ? 'outline' : 'default'}
                    onClick={() => onExecutar(s)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {feita ? 'Detalhes' : 'Executar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//   ABA: EXECUTAR (semana atual com pendentes)
// ─────────────────────────────────────────────────────────────

function ExecutarTab({ plano, sessoesFeitas, onExecutar, onMarcarFeita, marcando }: {
  plano: Plano;
  sessoesFeitas: any[];
  onExecutar: (s: SessaoPlano) => void;
  onMarcarFeita: (s: SessaoPlano) => void;
  marcando: boolean;
}) {
  // Calcula semana atual baseado em dias desde o início do plano
  const hoje = new Date();
  const inicio = new Date(plano.criadoEm);
  const diasPassados = Math.max(0, Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)));
  const semanaAtual = Math.min(plano.duracaoSemanas - 1, Math.floor(diasPassados / 7));
  const isDeload = semanaAtual % 4 === 3;

  // Calcula dias desde a última sessão feita do plano
  const diasSemTreinar = useMemo(() => {
    const sessoesPlano = sessoesFeitas.filter((sf) =>
      plano.sessoes.some((ps) => ps.id === sf.planoSessaoId),
    );
    if (sessoesPlano.length === 0) return diasPassados;
    const ultima = sessoesPlano
      .map((sf) => new Date(sf.data).getTime())
      .sort((a, b) => b - a)[0];
    return Math.floor((Date.now() - ultima) / (1000 * 60 * 60 * 24));
  }, [sessoesFeitas, plano.sessoes, diasPassados]);

  // Memoiza pendentes e feitas (pra usar no banner + no return)
  const sessoesPendentesMemo = useMemo(
    () => plano.sessoes.filter((s) => s.semanaIdx === semanaAtual && !sessoesFeitas.some((sf) => sf.planoSessaoId === s.id)),
    [plano.sessoes, semanaAtual, sessoesFeitas],
  );
  const sessoesFeitasSemana = useMemo(
    () => plano.sessoes.filter((s) => s.semanaIdx === semanaAtual && sessoesFeitas.some((sf) => sf.planoSessaoId === s.id)),
    [plano.sessoes, semanaAtual, sessoesFeitas],
  );

  // Sessões de hoje e futuras desta semana que ainda não foram feitas
  // (sessões pendentes e feitas já foram memoizadas em sessoesPendentesMemo e sessoesFeitasSemana)
  const proxima = sessoesPendentesMemo[0];

  return (
    <div className="space-y-4">
      {/* BANNER: DIAS SEM TREINAR */}
      {diasSemTreinar >= 3 && sessoesFeitas.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-amber-300">
                {diasSemTreinar} dias sem treinar
              </div>
              <div className="text-xs text-muted-foreground">
                Que tal voltar hoje? Seu programa está esperando.
              </div>
            </div>
            <Button size="sm" onClick={() => onExecutar(sessoesPendentesMemo[0] || sessoesFeitasSemana[0] || plano.sessoes[semanaAtual * plano.sessoesPorSemana])}>
              <Play className="h-3 w-3 mr-1" />
              Treinar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CARD RESUMO DA SEMANA */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-400">{semanaAtual + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">Você está na</div>
              <div className="font-bold text-lg">Semana {semanaAtual + 1} de {plano.duracaoSemanas}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>
                  {sessoesFeitasSemana.length}/{plano.sessoesPorSemana} feitas esta semana
                </span>
                {isDeload && (
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px]">
                    🛌 Semana de deload (volume reduzido)
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PRÓXIMA SESSÃO EM DESTAQUE */}
      {proxima && (
        <Card className="border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent shadow-lg shadow-amber-500/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-500 text-white">⭐ Próxima sessão</Badge>
              <Badge variant="outline">{proxima.tipo}</Badge>
            </div>
            <CardTitle className="text-xl">{proxima.nome}</CardTitle>
            <CardDescription>{proxima.foco} · ~{proxima.duracaoMin}min</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted/30 rounded p-3">
              <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Exercícios programados</div>
              <div className="space-y-1.5">
                {proxima.exercicios.map((ex, i) => (
                  <div key={i} className="text-sm flex items-center gap-2">
                    <span className="text-muted-foreground text-xs w-5 text-right">{i + 1}.</span>
                    <span className="flex-1">{ex.nome}</span>
                    <Badge variant="outline" className="text-xs">{ex.series}×{ex.reps}</Badge>
                    <Badge variant="outline" className="text-xs">{ex.carga}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onMarcarFeita(proxima)}
                disabled={marcando}
              >
                <Check className="h-4 w-4 mr-1" />
                {marcando ? 'Salvando...' : 'Marcar como feita'}
              </Button>
              <Button
                className="flex-1"
                size="lg"
                onClick={() => onExecutar(proxima)}
              >
                <Play className="h-4 w-4 mr-1" />
                Executar com detalhes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OUTRAS SESSÕES PENDENTES */}
      {sessoesPendentesMemo.length > 1 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
            📋 Restantes da semana ({sessoesPendentesMemo.length - 1})
          </h2>
          <div className="space-y-2">
            {sessoesPendentesMemo.slice(1).map((s) => (
              <Card key={s.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="outline">{s.tipo}</Badge>
                      <span className="font-medium truncate">{s.nome}</span>
                      <span className="text-xs text-muted-foreground">~{s.duracaoMin}min</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onMarcarFeita(s)} disabled={marcando}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onExecutar(s)}>
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* FEITAS */}
      {sessoesFeitasSemana.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
            ✓ Concluídas esta semana
          </h2>
          <div className="space-y-2">
            {sessoesFeitasSemana.map((s) => (
              <Card key={s.id} className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <Badge variant="outline">{s.tipo}</Badge>
                    <span className="flex-1 font-medium">{s.nome}</span>
                    <span className="text-xs text-muted-foreground">{s.duracaoMin}min</span>
                    <Button size="sm" variant="ghost" onClick={() => onExecutar(s)}>
                      <Activity className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ESTADO VAZIO */}
      {sessoesPendentesMemo.length === 0 && sessoesFeitasSemana.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-amber-400 mb-3" />
            <p className="text-lg font-semibold mb-1">Você está em dia! 🎉</p>
            <p className="text-sm text-muted-foreground mb-4">
              Nenhuma sessão pendente ou feita na semana atual.
            </p>
            <Button asChild variant="outline">
              <Link to="/app/treinamento/sessoes/nova">
                <Activity className="h-4 w-4 mr-1" />
                Registrar sessão livre
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//   ABA: PROGRESSO (aderência + stats)
// ─────────────────────────────────────────────────────────────

function ProgressoTab({ plano, sessoesFeitas }: {
  plano: Plano;
  sessoesFeitas: any[];
}) {
  const inicio = new Date(plano.criadoEm);
  const hoje = new Date();
  const diasPassados = Math.max(0, Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)));
  const semanaAtual = Math.min(plano.duracaoSemanas - 1, Math.floor(diasPassados / 7));
  const diasTotais = plano.duracaoSemanas * 7;

  const sessoesFeitasPlano = sessoesFeitas.filter((sf) =>
    plano.sessoes.some((ps) => ps.id === sf.planoSessaoId),
  );

  // Conta sessoesFeitasPlano por semana (deduplicando)
  const sessoesFeitasPlanoUnicas = (() => {
    const seen = new Set<string>();
    return sessoesFeitasPlano.filter((sf) => {
      if (!sf.planoSessaoId) return false;
      if (seen.has(sf.planoSessaoId)) return false;
      seen.add(sf.planoSessaoId);
      return true;
    });
  })();

  const totalSessoesPlano = plano.sessoes.length;
  const sessoesEsperadasAteHoje = (semanaAtual + 1) * plano.sessoesPorSemana;
  const aderencia = sessoesEsperadasAteHoje > 0
    ? Math.min(100, Math.round((sessoesFeitasPlanoUnicas.length / sessoesEsperadasAteHoje) * 100))
    : 0;

  const percentualConcluido = Math.round((semanaAtual / plano.duracaoSemanas) * 100);

  // Memoiza início do plano (pra usar em vários useMemo)
  const inicioMemo = useMemo(() => new Date(plano.criadoEm), [plano.criadoEm]);

  // Streak — dias consecutivos com pelo menos 1 sessão
  const streak = useMemo(() => {
    const datas = new Set<string>();
    sessoesFeitasPlanoUnicas.forEach((sf) => {
      if (sf.data) {
        const d = new Date(sf.data);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        datas.add(key);
      }
    });

    let count = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    // Permite 1 dia de folga (ontem)
    const inicioTs = inicioMemo.getTime();
    while (count < 365) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (datas.has(key)) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (count === 0) {
        cursor.setDate(cursor.getDate() - 1);
        // Permite começar a contagem de ontem
        if (cursor.getTime() < inicioTs) break;
        const keyYesterday = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
        if (!datas.has(keyYesterday)) break;
      } else {
        break;
      }
    }
    return count;
  }, [sessoesFeitasPlanoUnicas, inicioMemo]);

  // Calendário do plano (heatmap de aderência)
  const diasCalendario = useMemo(() => {
    const result: Array<{ data: Date; feita: boolean; semanaIdx: number; temSessao: boolean }> = [];
    for (let i = 0; i <= diasPassados && i < diasTotais; i++) {
      const data = new Date(inicioMemo);
      data.setDate(data.getDate() + i);
      const key = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
      const feita = sessoesFeitasPlanoUnicas.some((sf) => {
        const sd = new Date(sf.data);
        const skey = `${sd.getFullYear()}-${sd.getMonth()}-${sd.getDate()}`;
        return skey === key;
      });
      result.push({
        data,
        feita,
        semanaIdx: Math.floor(i / 7),
        temSessao: true,
      });
    }
    return result;
  }, [diasPassados, diasTotais, sessoesFeitasPlanoUnicas, inicioMemo]);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Aderência" value={`${aderencia}%`} icon={Target} accent="emerald" />
        <Kpi label="Sessões feitas" value={String(sessoesFeitasPlanoUnicas.length)} icon={Check} accent="blue" />
        <Kpi label="Total no plano" value={String(totalSessoesPlano)} icon={Activity} accent="purple" />
        <Kpi label="Streak" value={streak > 0 ? `${streak}d` : '—'} icon={Flame} accent="amber" sublabel={streak > 0 ? '🔥 dias consecutivos' : 'comece hoje'} />
      </div>

      {/* BARRA DE PROGRESSO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📅 Progresso do plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Semana {semanaAtual + 1} de {plano.duracaoSemanas}</span>
              <span className="text-muted-foreground">{diasPassados} / {diasTotais} dias</span>
            </div>
            <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="h-4 bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-500"
                style={{ width: `${percentualConcluido}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CALENDÁRIO / HEATMAP */}
      {diasCalendario.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🗓️ Calendário de treinos</CardTitle>
            <CardDescription>Cada quadrado = 1 dia. Verde = treinou.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-14 gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(14px, 1fr))' }}>
              {diasCalendario.map((d, i) => {
                const cor = d.feita
                  ? 'bg-emerald-500'
                  : d.semanaIdx % 4 === 3
                  ? 'bg-amber-700/40'
                  : 'bg-muted';
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-sm ${cor}`}
                    title={`${d.data.toLocaleDateString('pt-BR')} · ${d.feita ? 'Treinou' : 'Descansou'}`}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span>Treinou</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-amber-700/40" />
                <span>Deload</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted" />
                <span>Descansou</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ADERÊNCIA POR SEMANA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📊 Aderência por semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: plano.duracaoSemanas }).map((_, i) => {
              const sessoesEsperadas = plano.sessoesPorSemana;
              const sessoesFeitasSemana = plano.sessoes
                .filter((s) => s.semanaIdx === i)
                .filter((s) => sessoesFeitasPlanoUnicas.some((sf) => sf.planoSessaoId === s.id)).length;
              const aderenciaSemana = Math.round((sessoesFeitasSemana / sessoesEsperadas) * 100);
              const isAtual = i === semanaAtual;
              const isDeloadSem = i % 4 === 3;
              return (
                <div key={i} className={`flex items-center gap-2 text-xs ${isAtual ? 'font-bold' : ''}`}>
                  <span className="w-12 text-right">S{i + 1}</span>
                  {isDeloadSem && <span className="text-amber-400 text-[10px]">🛌</span>}
                  <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-4 transition-all ${
                        aderenciaSemana >= 80 ? 'bg-emerald-500' :
                        aderenciaSemana >= 50 ? 'bg-amber-500' :
                        aderenciaSemana > 0 ? 'bg-rose-500' : 'bg-muted'
                      }`}
                      style={{ width: `${aderenciaSemana}%` }}
                    />
                  </div>
                  <span className="w-16 text-muted-foreground">{sessoesFeitasSemana}/{sessoesEsperadas}</span>
                  <span className="w-12 text-right">{aderenciaSemana}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* FEEDBACK */}
      {aderencia >= 80 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-emerald-400" />
            <div>
              <div className="font-bold text-emerald-300">Excelente aderência!</div>
              <div className="text-xs text-muted-foreground">
                Você está seguindo o plano direitinho. Continue assim!
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {aderencia < 50 && sessoesEsperadasAteHoje > 5 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-amber-400" />
            <div>
              <div className="font-bold text-amber-300">Aderência baixa</div>
              <div className="text-xs text-muted-foreground">
                Que tal reduzir a frequência ou duração para algo mais sustentável?
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {streak >= 7 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Flame className="h-8 w-8 text-amber-400" />
            <div>
              <div className="font-bold text-amber-300">Streak de {streak} dias! 🔥</div>
              <div className="text-xs text-muted-foreground">
                Você está pegando embalo. Não pare agora!
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Kpi({ label, value, icon: Icon, accent, sublabel }: any) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <Icon className={`h-4 w-4 ${colorMap[accent]}`} />
          <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
        </div>
        <div className={`text-2xl font-bold ${colorMap[accent]}`}>{value}</div>
        {sublabel && <div className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</div>}
      </CardContent>
    </Card>
  );
}

function TabButton({ current, value, onClick, icon: Icon, label, disabled, badge }: any) {
  const active = current === value;
  return (
    <button
      onClick={() => !disabled && onClick(value)}
      disabled={disabled}
      className={`relative flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
        active ? 'border-emerald-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {badge && (
        <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
//   HELPERS
// ─────────────────────────────────────────────────────────────

function exportarPlanoTexto(plano: Plano): string {
  const linhas: string[] = [];
  linhas.push(`═══════════════════════════════════════════════`);
  linhas.push(`  ${OBJETIVOS_ICONE[plano.objetivo]} ${plano.nome}`);
  linhas.push(`═══════════════════════════════════════════════`);
  linhas.push(`Objetivo: ${OBJETIVOS_LABEL[plano.objetivo]}`);
  linhas.push(`Nível: ${plano.nivel}`);
  linhas.push(`Equipamento: ${plano.equipamento}`);
  linhas.push(`Frequência: ${plano.sessoesPorSemana}× por semana`);
  linhas.push(`Duração: ${plano.duracaoSessaoMin} min por sessão`);
  linhas.push(`Total: ${plano.duracaoSemanas} semanas (${plano.sessoes.length} sessões)`);
  linhas.push(`Criado em: ${new Date(plano.criadoEm).toLocaleDateString('pt-BR')}`);
  linhas.push(``);
  linhas.push(`───────────────────────────────────────────────`);

  for (let sem = 0; sem < plano.duracaoSemanas; sem++) {
    const sessoesDaSemana = plano.sessoes.filter((s) => s.semanaIdx === sem);
    const isDeload = sem % 4 === 3;
    linhas.push(``);
    linhas.push(`📅 SEMANA ${sem + 1}${isDeload ? '  🛌 DELOAD' : ''}`);
    sessoesDaSemana.forEach((s) => {
      linhas.push(``);
      linhas.push(`  Treino ${s.tipo} — ${s.nome}`);
      linhas.push(`  Foco: ${s.foco} · ${s.duracaoMin}min`);
      linhas.push(`  Exercícios:`);
      s.exercicios.forEach((ex, i) => {
        linhas.push(`    ${i + 1}. ${ex.nome} — ${ex.series}×${ex.reps} · ${ex.carga} · descanso ${ex.descansoSeg}s`);
      });
    });
  }

  linhas.push(``);
  linhas.push(`───────────────────────────────────────────────`);
  linhas.push(`Gerado pelo Top Pickleball 50+ · ${new Date().toLocaleDateString('pt-BR')}`);
  return linhas.join('\n');
}
