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
 * Firestore: toppkb_users/{uid}/programa/atual (doc) — 4 segmentos ✓
 * localStorage: treinamento-programa (cache)
 *
 * ATENÇÃO: caminho antigo era toppkb_users/{uid}/treinamento/programa/atual
 * que tem 5 segmentos (ímpar) e quebra no Firestore. Corrigido.
 */

import { treinoCol, programaAtualDoc } from '@/lib/firestorePaths';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDoc, query, orderBy, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { safeSetDoc, safeAddDoc } from '@/lib/firestoreWithAuth';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';
import { Confetti } from '@/components/Confetti';
import { useConfirm } from '@/hooks/useConfirm';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SkeletonCard } from '@/components/ui/skeleton';
import { SetupTab } from './treino-mp/SetupTab';
import { PlanoTab } from './treino-mp/PlanoTab';
import { ExecutarTab } from './treino-mp/ExecutarTab';
import { ProgressoTab } from './treino-mp/ProgressoTab';
import {
  ChevronLeft, Target, Calendar, Activity,
  Sparkles, Trash2,
  Download, Copy,
} from 'lucide-react';
import type { Plano } from '@/lib/geradorPlano';

const STORAGE_KEY = 'treinamento-programa';

type Tab = 'setup' | 'plano' | 'executar' | 'progresso';

// ─────────────────────────────────────────────────────────────
//   COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export function TreinamentoMeuPrograma() {
  const { user } = useAuth();
  const { confirm, ConfirmDialogRoot } = useConfirm();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('setup');
  const [showConfetti, setShowConfetti] = useState(false);

  // Plano ativo
  const { data: plano, isLoading: loadingPlano } = useQuery({
    queryKey: ['treinamento-programa', user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const ref = programaAtualDoc(db, user.uid);
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
      const ref = programaAtualDoc(db, user.uid);
      await safeSetDoc(user, ref, { uid: user.uid, ...novoPlano, savedAt: new Date().toISOString() });
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
        treinoCol(db, user.uid, 'sessoes'),
        orderBy('data', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  // Marcar como feita (rápido - cria sessão minimal)
  // Guard contra clique duplo / race condition
  const [pendingSessaoId, setPendingSessaoId] = useState<string | null>(null);
  const marcarFeita = useMutation({
    mutationFn: async (s: SessaoPlano) => {
      if (!user || !plano) throw new Error('Usuário não autenticado');
      // Guard: previne criação duplicada se clicar 2x
      if (pendingSessaoId === s.id) {
        throw new Error('Já está sendo marcada como feita');
      }
      setPendingSessaoId(s.id);
      try {
        const docRef = await safeAddDoc(
          user,
          treinoCol(db, user.uid, 'sessoes'),
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
      } finally {
        setPendingSessaoId(null);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['treinamento-sessoes-para-plano'] });
      toast({ title: 'Sessão marcada como feita! ✅', variant: 'success' });
    },
    onError: (e: Error) => {
      // Ignora erro de guard (não polui toast)
      if (!e.message.includes('Já está')) {
        toast({ title: 'Erro ao marcar', description: e.message, variant: 'destructive' });
      }
    },
  });

  // Auto-pula para "executar" se já tem plano (apenas quando carrega pela primeira vez)
  const [autoSkipDone, setAutoSkipDone] = useState(false);
  useEffect(() => {
    if (plano && !autoSkipDone && !loadingPlano) {
      setTab('executar');
      setAutoSkipDone(true);
    }
  }, [plano, loadingPlano, autoSkipDone]);

  if (loadingPlano) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const handleApagar = async () => {
    if (!plano) return;
    const ok = await confirm({
      titulo: `Apagar programa "${plano.nome}"?`,
      descricao: 'Esta ação não pode ser desfeita. Todo o histórico do programa será perdido.',
      confirmText: 'Sim, apagar',
      cancelText: 'Manter',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      if (user) {
        await safeSetDoc(
          user,
          programaAtualDoc(db, user.uid),
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
      <Breadcrumbs />
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
      <ConfirmDialogRoot />
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
//   HELPERS
// ─────────────────────────────────────────────────────────────

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
