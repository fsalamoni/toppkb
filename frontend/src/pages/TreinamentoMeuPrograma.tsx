/**
 * 🏋️ Treinamento · Meu Programa
 *
 * Hub único de planejamento + execução:
 * 1. SETUP — Define objetivo, frequência, duração, equipamento, nível
 * 2. PLANO — Visualização semana-a-semana das sessões geradas
 * 3. EXECUTAR — Próximas sessões pendentes + botão "registrar como feita"
 * 4. PROGRESSO — Stats de aderência do plano (aderência, %, avanço)
 *
 * Sub-rota: /app/treinamento/meu-programa
 *
 * Firestore: toppkb_users/{uid}/treinamento/programa (atual)
 * localStorage: treinamento-programa (cache do plano ativo)
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection, doc, getDoc, setDoc, getDocs, query,
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
import {
  ChevronLeft, Target, Calendar, Activity, ChevronRight,
  Check, Sparkles, Dumbbell, Trophy, Trash2,
  AlertCircle, TrendingUp, Clock, Play,
} from 'lucide-react';
import {
  gerarPlano, OBJETIVOS_LABEL, OBJETIVOS_ICONE,
  type Plano, type Objetivo, type Nivel, type Equipamento, type SessaoPlano,
  type PlanoInput,
} from '@/lib/geradorPlano';

const STORAGE_KEY = 'treinamento-programa';

type Tab = 'setup' | 'plano' | 'executar' | 'progresso';

export function TreinamentoMeuPrograma() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('setup');

  // Carrega plano ativo (Firestore → fallback localStorage)
  const { data: plano, isLoading } = useQuery({
    queryKey: ['treinamento-programa', user?.uid],
    queryFn: async () => {
      if (!user) return null;
      // 1. Tenta Firestore (doc fixo: 'atual')
      const ref = doc(db, 'toppkb_users', user.uid, 'treinamento', 'programa', 'atual');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data() as Plano;
      }
      // 2. Fallback localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored) as Plano;
      } catch (e) {
        console.warn(e);
      }
      return null;
    },
    enabled: !!user,
  });

  // Salva plano ativo
  const savePlano = useMutation({
    mutationFn: async (novoPlano: Plano) => {
      if (!user) return;
      const ref = doc(db, 'toppkb_users', user.uid, 'treinamento', 'programa', 'atual');
      await setDoc(ref, { ...novoPlano, savedAt: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novoPlano));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['treinamento-programa'] });
      toast({ title: 'Programa salvo!', variant: 'success' });
    },
  });

  // Sessões executadas (para cruzar com o plano)
  const sessoes = useQuery({
    queryKey: ['treinamento-sessoes', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'toppkb_users', user.uid, 'treinamento', 'sessoes'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  // Auto-pula para "executar" se já existe um plano
  useEffect(() => {
    if (plano && tab === 'setup') {
      setTab('executar');
    }
  }, [plano]); // eslint-disable-line

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{OBJETIVOS_ICONE[plano.objetivo]}</span>
                  <div>
                    <div className="font-bold text-lg">{plano.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {OBJETIVOS_LABEL[plano.objetivo]} · {plano.duracaoSemanas}sem · {plano.sessoesPorSemana}×/sem · {plano.duracaoSessaoMin}min
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setTab('setup')}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Novo
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Apagar programa atual?')) {
                      localStorage.removeItem(STORAGE_KEY);
                      setTab('setup');
                      qc.invalidateQueries({ queryKey: ['treinamento-programa'] });
                    }
                  }}
                >
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
        <TabButton current={tab} value="executar" onClick={setTab} icon={Activity} label="Executar" disabled={!plano} />
        <TabButton current={tab} value="progresso" onClick={setTab} icon={TrendingUp} label="Progresso" disabled={!plano} />
      </div>

      {/* CONTEÚDO */}
      {tab === 'setup' && (
        <SetupTab
          planoAtual={plano}
          onCriar={(p) => {
            savePlano.mutate(p);
            setTab('executar');
          }}
          saving={savePlano.isPending}
        />
      )}

      {tab === 'plano' && plano && (
        <PlanoTab plano={plano} sessoesFeitas={sessoes.data || []} onExecutar={(s) => {
          localStorage.setItem('treinamento-sessao-pendente', JSON.stringify(s));
          navigate('/app/treinamento/sessoes/nova?planoId=' + s.id);
        }} />
      )}

      {tab === 'executar' && plano && (
        <ExecutarTab
          plano={plano}
          sessoesFeitas={sessoes.data || []}
          onExecutar={(s) => {
            localStorage.setItem('treinamento-sessao-pendente', JSON.stringify(s));
            navigate('/app/treinamento/sessoes/nova?planoId=' + s.id);
          }}
        />
      )}

      {tab === 'progresso' && plano && (
        <ProgressoTab plano={plano} sessoesFeitas={sessoes.data || []} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//   ABA: SETUP
// ─────────────────────────────────────────────────────────────

function SetupTab({ onCriar, saving }: {
  planoAtual?: Plano | null;
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

  // Pré-visualização
  const preview = useMemo(() => {
    try {
      return gerarPlano(form);
    } catch {
      return null;
    }
  }, [form]);

  return (
    <div className="space-y-4">
      {/* Indicador de passo */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step >= n ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {n}
            </div>
            <span className={step === n ? 'text-foreground font-medium' : ''}>
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
              <Label>Frequência semanal: <span className="text-blue-400">{form.sessoesPorSemana}× por semana</span></Label>
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
              <Label>Duração por sessão: <span className="text-blue-400">{form.duracaoSessaoMin} min</span></Label>
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
                <span>20min</span>
                <span>45min (padrão)</span>
                <span>90min</span>
              </div>
            </div>

            <div>
              <Label>Duração total do plano: <span className="text-blue-400">{form.duracaoSemanas} semanas</span></Label>
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
                    className={`p-2 rounded-lg border-2 text-xs ${
                      form.equipamento === eq
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    {eq === 'kb_leve' ? '🏋️ KB leve' :
                     eq === 'kb_completo' ? '🏋️ KB completo' :
                     eq === 'peso_corporal' ? '🤸 Só peso corporal' :
                     '🏢 Academia completa'}
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
                    className={`p-3 rounded-lg border-2 ${
                      form.nivel === n
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-muted/30 border-border'
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
                {preview.sessoes.slice(0, 6).map((s) => (
                  <div key={s.id} className="text-xs flex items-center gap-2">
                    <Badge variant="outline">Sem {s.semanaIdx + 1}</Badge>
                    <Badge variant="outline">{s.tipo}</Badge>
                    <span className="flex-1">{s.nome}</span>
                    <span className="text-muted-foreground">{s.duracaoMin}min</span>
                  </div>
                ))}
                {preview.sessoes.length > 6 && (
                  <div className="text-xs text-muted-foreground">
                    + {preview.sessoes.length - 6} sessões...
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
          Voltar
        </Button>
        {step < 4 && (
          <Button onClick={() => setStep(Math.min(4, step + 1))}>
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
//   ABA: PLANO
// ─────────────────────────────────────────────────────────────

function PlanoTab({ plano, sessoesFeitas, onExecutar }: {
  plano: Plano;
  sessoesFeitas: any[];
  onExecutar: (s: SessaoPlano) => void;
}) {
  const [semanaAtual, setSemanaAtual] = useState(0);

  const sessoesDaSemana = plano.sessoes.filter((s) => s.semanaIdx === semanaAtual);
  const cicloSemana = semanaAtual % 4;
  const isDeload = cicloSemana === 3;

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
            {Array.from({ length: plano.duracaoSemanas }).map((_, i) => (
              <button
                key={i}
                onClick={() => setSemanaAtual(i)}
                className={`h-3 flex-1 rounded ${
                  i === semanaAtual ? 'bg-emerald-500' :
                  i < semanaAtual ? 'bg-emerald-700/50' :
                  i % 4 === 3 ? 'bg-amber-700/30' :
                  'bg-muted'
                }`}
                title={`Semana ${i + 1}${i % 4 === 3 ? ' (deload)' : ''}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sessoesDaSemana.map((s) => {
          const feita = sessoesFeitas.some((sf) => sf.planoSessaoId === s.id);
          return (
            <Card key={s.id} className={feita ? 'border-emerald-500/50 bg-emerald-500/5' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{s.tipo}</Badge>
                  {feita && <Check className="h-4 w-4 text-emerald-400" />}
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
                <Button
                  size="sm"
                  className="w-full"
                  variant={feita ? 'outline' : 'default'}
                  onClick={() => onExecutar(s)}
                >
                  {feita ? (
                    <>
                      <Activity className="h-3 w-3 mr-1" />
                      Registrar nova
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Executar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//   ABA: EXECUTAR
// ─────────────────────────────────────────────────────────────

function ExecutarTab({ plano, sessoesFeitas, onExecutar }: {
  plano: Plano;
  sessoesFeitas: any[];
  onExecutar: (s: SessaoPlano) => void;
}) {
  const hoje = new Date();
  const inicio = new Date(plano.criadoEm);
  const diasPassados = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  const semanaAtual = Math.min(plano.duracaoSemanas - 1, Math.max(0, Math.floor(diasPassados / 7)));

  const sessoesPendentes = plano.sessoes
    .filter((s) => s.semanaIdx === semanaAtual && !sessoesFeitas.some((sf) => sf.planoSessaoId === s.id));

  const sessoesFeitasSemana = plano.sessoes
    .filter((s) => s.semanaIdx === semanaAtual && sessoesFeitas.some((sf) => sf.planoSessaoId === s.id));

  return (
    <div className="space-y-4">
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-400">{semanaAtual + 1}</span>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Você está na</div>
              <div className="font-bold">Semana {semanaAtual + 1} de {plano.duracaoSemanas}</div>
              <div className="text-xs text-muted-foreground">
                {sessoesPendentes.length} pendente{sessoesPendentes.length !== 1 ? 's' : ''} · {sessoesFeitasSemana.length} feita{sessoesFeitasSemana.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {sessoesPendentes.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
            🎯 Próximas sessões
          </h2>
          <div className="space-y-3">
            {sessoesPendentes.map((s) => (
              <Card key={s.id} className="border-2 border-amber-500/30 hover:border-amber-500/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{s.tipo}</Badge>
                        <Badge className="bg-amber-500/20 text-amber-300">Pendente</Badge>
                        <span className="text-xs text-muted-foreground">~{s.duracaoMin}min</span>
                      </div>
                      <div className="font-semibold">{s.nome}</div>
                      <div className="text-xs text-muted-foreground">{s.foco}</div>
                      <div className="mt-2 text-xs">
                        <strong>Exercícios:</strong> {s.exercicios.map((e) => e.nome).join(' · ')}
                      </div>
                    </div>
                    <Button onClick={() => onExecutar(s)}>
                      <Play className="h-4 w-4 mr-1" />
                      Executar agora
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {sessoesFeitasSemana.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
            ✓ Feitas nesta semana
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {sessoesPendentes.length === 0 && sessoesFeitasSemana.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-amber-400 mb-3" />
            <p className="text-lg font-semibold mb-1">Semana completa! 🎉</p>
            <p className="text-sm text-muted-foreground">
              Você treinou tudo. Descanse e volte na próxima semana.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//   ABA: PROGRESSO
// ─────────────────────────────────────────────────────────────

function ProgressoTab({ plano, sessoesFeitas }: {
  plano: Plano;
  sessoesFeitas: any[];
}) {
  const inicio = new Date(plano.criadoEm);
  const hoje = new Date();
  const diasPassados = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  const semanaAtual = Math.min(plano.duracaoSemanas - 1, Math.max(0, Math.floor(diasPassados / 7)));
  const diasTotais = plano.duracaoSemanas * 7;

  const sessoesFeitasPlano = sessoesFeitas.filter((sf) =>
    plano.sessoes.some((ps) => ps.id === sf.planoSessaoId)
  );

  const totalSessoesPlano = plano.sessoes.length;
  const sessoesEsperadasAteHoje = (semanaAtual + 1) * plano.sessoesPorSemana;
  const aderencia = sessoesEsperadasAteHoje > 0
    ? Math.min(100, Math.round((sessoesFeitasPlano.length / sessoesEsperadasAteHoje) * 100))
    : 0;

  const percentualConcluido = Math.round((semanaAtual / plano.duracaoSemanas) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Aderência" value={`${aderencia}%`} icon={Target} accent="emerald" />
        <Kpi label="Sessões feitas" value={String(sessoesFeitasPlano.length)} icon={Check} accent="blue" />
        <Kpi label="Total no plano" value={String(totalSessoesPlano)} icon={Activity} accent="purple" />
        <Kpi label="% Concluído" value={`${percentualConcluido}%`} icon={Trophy} accent="amber" />
      </div>

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
                className="h-4 bg-gradient-to-r from-emerald-500 to-amber-500 transition-all"
                style={{ width: `${percentualConcluido}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
                .filter((s) => sessoesFeitas.some((sf) => sf.planoSessaoId === s.id)).length;
              const aderenciaSemana = Math.round((sessoesFeitasSemana / sessoesEsperadas) * 100);
              const isAtual = i === semanaAtual;
              return (
                <div key={i} className={`flex items-center gap-2 text-xs ${isAtual ? 'font-bold' : ''}`}>
                  <span className="w-12 text-right">S{i + 1}</span>
                  <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-4 ${
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
    </div>
  );
}

function Kpi({ label, value, icon: Icon, accent }: any) {
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
      </CardContent>
    </Card>
  );
}

function TabButton({ current, value, onClick, icon: Icon, label, disabled }: any) {
  const active = current === value;
  return (
    <button
      onClick={() => !disabled && onClick(value)}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
        active ? 'border-emerald-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
