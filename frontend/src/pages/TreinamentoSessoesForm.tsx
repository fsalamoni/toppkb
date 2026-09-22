/**
 * 🏋️ Treinamento · Sessões — Form (Criar / Editar)
 *
 * Form completo de sessão de treino com:
 * - Header (título, tipo, data, local, parceiro)
 * - Métricas (duração, RPE, distância, calorias)
 * - Séries (exercícios com séries/reps/carga/RPE/notas)
 * - Descrição / observações
 *
 * Rotas:
 *   /app/treinamento/sessoes/nova   → criar
 *   /app/treinamento/sessoes/:id    → editar
 */

import { treinoCol, treinoDoc } from '@/lib/firestorePaths';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getDoc, serverTimestamp,
} from 'firebase/firestore';
import { ExerciseBadge, useExerciseModal } from '@/components/common/ExerciseBadge';
import { db } from '@/lib/firebase';
import { safeSetDoc, safeAddDoc, ensureFreshToken } from '@/lib/firestoreWithAuth';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import {
  ChevronLeft, Save, Plus, Trash2, Search,
  Activity, FileText, ChevronUp, ChevronDown, Timer,
} from 'lucide-react';
import {
  KETTLEBELL_EXERCICIOS,
  KETTLEBELL_PATTERNS,
  type PadraoKettlebell,
} from '@/data/seed/exercicios-kettlebell';
import { WorkoutTimer } from '@/components/treinamento/WorkoutTimer';

interface SeriePrescrita {
  exercicioId: string;          // 'kb-swing-2h-hardstyle' ou nome livre
  nome: string;                  // snapshot do nome
  padrao?: string;               // HINGE/SQUAT/etc
  series: number;
  reps: number | string;
  carga: string;                 // "16kg", "BW", "50% 1RM"
  rpe?: number;                  // 1-10
  descansoSeg?: number;
  notas?: string;
  isCustom?: boolean;            // true se não está no catálogo KB
}

interface FormState {
  titulo: string;
  data: string;                  // ISO datetime-local
  tipo: string;
  local: string;
  parceiro: string;
  duracaoMin: number;
  rpeMedio: number;
  distanciaKm: number;
  calorias: number;
  observacoes: string;
  exercicios: SeriePrescrita[];
  planoOrigemId?: string;        // se vier de um plano
  periodoId?: string;            // se vier de um período curto/médio/longo
}

const TIPOS_SESSAO = [
  { value: 'forca', label: '💪 Força' },
  { value: 'hipertrofia', label: '💪 Hipertrofia' },
  { value: 'potencia', label: '⚡ Potência' },
  { value: 'resistencia', label: '🫀 Resistência' },
  { value: 'mobilidade', label: '🤸 Mobilidade' },
  { value: 'kettlebell', label: '🏋️ Kettlebell' },
  { value: 'cardio', label: '❤️ Cardio' },
  { value: 'core', label: '🧱 Core' },
  { value: 'misto', label: '⚡ Misto' },
  { value: 'tecnica', label: '🎯 Técnica' },
  { value: 'avaliacao', label: '📊 Avaliação' },
  { value: 'descanso', label: '🛌 Descanso ativo' },
];

const LOCAIS = [
  'Academia',
  'Casa',
  'Parque',
  'Praia',
  'Quadra',
  'Clube',
  'Outro',
];

function initialState(): FormState {
  return {
    titulo: '',
    data: new Date().toISOString().slice(0, 16),
    tipo: 'kettlebell',
    local: 'Academia',
    parceiro: '',
    duracaoMin: 45,
    rpeMedio: 7,
    distanciaKm: 0,
    calorias: 0,
    observacoes: '',
    exercicios: [],
  };
}

export function TreinamentoSessoesForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [form, setForm] = useState<FormState>(initialState());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [planoSessaoId, setPlanoSessaoId] = useState<string | null>(null);
  const { showExercise, ModalRoot } = useExerciseModal();

  // Plano ID vindo da URL (?planoId=xxx)
  const planoIdFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('planoId');
  }, []);
  const [buscaExercicio, setBuscaExercicio] = useState('');
  const [showExercicioPicker, setShowExercicioPicker] = useState(false);

  // Carregar sessão existente OU template do localStorage
  useEffect(() => {
    if (!user) return;

    if (id) {
      // Editando sessão existente
      (async () => {
        try {
          const snap = await getDoc(
            treinoDoc(db, user.uid, 'sessoes', id),
          );
          if (snap.exists()) {
            const data = snap.data();
            if (data.planoSessaoId) setPlanoSessaoId(data.planoSessaoId);
            setForm({
              ...initialState(),
              ...data,
              exercicios: Array.isArray(data.exercicios) ? data.exercicios : [],
              data: typeof data.data === 'string'
                ? data.data.slice(0, 16)
                : new Date(data.data?.toDate?.() || data.data || Date.now()).toISOString().slice(0, 16),
            });
          }
        } catch (e: any) {
          toast({ title: 'Erro ao carregar', description: e.message, variant: 'destructive' });
        } finally {
          setLoading(false);
        }
      })();
    } else {
      // Verifica se veio template do localStorage
      const templateStr = localStorage.getItem('treinamento-template-aplicar');
      if (templateStr) {
        try {
          const t = JSON.parse(templateStr);
          setForm({
            ...initialState(),
            titulo: t.nome || '',
            tipo: t.tipo || 'kettlebell',
            duracaoMin: t.duracaoEstimadaMin || 45,
            exercicios: Array.isArray(t.exercicios) ? t.exercicios : [],
          });
          toast({
            title: 'Template aplicado!',
            description: `${t.exercicios?.length || 0} exercícios carregados`,
          });
          localStorage.removeItem('treinamento-template-aplicar');
        } catch (e) {
          console.error('Erro ao aplicar template', e);
        }
      } else {
        // Verifica se veio sessão do plano pendente
        const planoStr = localStorage.getItem('treinamento-sessao-pendente');
        if (planoStr) {
          try {
            const s = JSON.parse(planoStr);
            setForm({
              ...initialState(),
              titulo: `${s.nome} (Sem ${s.semanaIdx + 1}${s.tipo})`,
              tipo: 'kettlebell',
              duracaoMin: s.duracaoMin || 45,
              observacoes: `Sessão do programa: ${s.nome} — Semana ${s.semanaIdx + 1} (${s.tipo})`,
              exercicios: Array.isArray(s.exercicios) ? s.exercicios.map((ex: any) => ({
                nome: ex.nome,
                series: ex.series,
                reps: ex.reps,
                carga: ex.carga,
                descansoSeg: ex.descansoSeg,
              })) : [],
            });
            toast({
              title: `Sessão ${s.tipo} carregada!`,
              description: `${s.exercicios?.length || 0} exercícios do programa`,
            });
            if (s.id) setPlanoSessaoId(s.id);
            localStorage.removeItem('treinamento-sessao-pendente');
          } catch (e) {
            console.error('Erro ao carregar sessão do plano', e);
          }
        }
      }
      setLoading(false);
    }
  }, [id, user]);

  // Adicionar exercício da biblioteca KB
  const exerciciosFiltrados = useMemo(() => {
    if (!buscaExercicio) return KETTLEBELL_EXERCICIOS.slice(0, 30);
    const q = buscaExercicio.toLowerCase();
    return KETTLEBELL_EXERCICIOS.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        e.descricao.toLowerCase().includes(q) ||
        (e.padraoKb && e.padraoKb.toLowerCase().includes(q)),
    ).slice(0, 50);
  }, [buscaExercicio]);

  function addExercicioKb(ex: typeof KETTLEBELL_EXERCICIOS[number]) {
    setForm({
      ...form,
      exercicios: [
        ...form.exercicios,
        {
          exercicioId: ex.id,
          nome: ex.nome,
          padrao: ex.padraoKb,
          series: 3,
          reps: 10,
          carga: ex.equipamento === 'peso-corporal' || ex.equipamento === 'nenhum' ? 'BW' : '— kg',
          rpe: 7,
          descansoSeg: 90,
          isCustom: false,
        },
      ],
    });
    setShowExercicioPicker(false);
    setBuscaExercicio('');
  }

  function addExercicioCustom() {
    const nome = prompt('Nome do exercício:');
    if (!nome) return;
    setForm({
      ...form,
      exercicios: [
        ...form.exercicios,
        {
          exercicioId: `custom-${Date.now()}`,
          nome,
          series: 3,
          reps: 10,
          carga: '— kg',
          rpe: 7,
          descansoSeg: 90,
          isCustom: true,
        },
      ],
    });
  }

  function updateExercicio(idx: number, patch: Partial<SeriePrescrita>) {
    const novos = [...form.exercicios];
    novos[idx] = { ...novos[idx], ...patch };
    setForm({ ...form, exercicios: novos });
  }

  function removeExercicio(idx: number) {
    const novos = form.exercicios.filter((_, i) => i !== idx);
    setForm({ ...form, exercicios: novos });
  }

  function moveExercicio(idx: number, dir: -1 | 1) {
    const novoIdx = idx + dir;
    if (novoIdx < 0 || novoIdx >= form.exercicios.length) return;
    const novos = [...form.exercicios];
    [novos[idx], novos[novoIdx]] = [novos[novoIdx], novos[idx]];
    setForm({ ...form, exercicios: novos });
  }

  // Volume total = soma de (séries × reps × carga kg)
  const volumeTotal = useMemo(() => {
    return form.exercicios.reduce((acc, ex) => {
      const cargaKg = parseFloat(String(ex.carga).replace(/[^0-9.]/g, '')) || 0;
      const reps = typeof ex.reps === 'number' ? ex.reps : Number(String(ex.reps).match(/^\d+/)?.[0] || 0);
      return acc + ex.series * reps * cargaKg;
    }, 0);
  }, [form.exercicios]);

  async function onSave() {
    if (!user) return;
    if (!form.titulo.trim() && form.exercicios.length === 0) {
      toast({ title: 'Adicione um título ou ao menos 1 exercício', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // CRÍTICO: força refresh do token para evitar PERMISSION_DENIED
      // Só faz se online — offline não precisa
      if (navigator.onLine) {
        await ensureFreshToken(user);
      }

      const payload = {
        uid: user.uid,
        ...form,
        data: new Date(form.data).toISOString(),
        volumeTotal,
        planoSessaoId: planoSessaoId || planoIdFromUrl || null,
        updatedAt: serverTimestamp(),
      };

      if (id) {
        await safeSetDoc(
          user,
          treinoDoc(db, user.uid, 'sessoes', id),
          payload,
          { merge: true },
        );
        toast.success('Sessão atualizada!');
      } else {
        await safeAddDoc(
          user,
          treinoCol(db, user.uid, 'sessoes'),
          { ...payload, createdAt: serverTimestamp() },
        );
        // Mensagem indica que se offline, vai pra fila
        if (navigator.onLine) {
          toast.success('Sessão registrada!');
        } else {
          toast.info('Sessão será sincronizada quando voltar online');
        }
      }
      navigate('/app/treinamento/sessoes');
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/app/treinamento/sessoes">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Sessões
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">
          {id ? 'Editar Sessão' : 'Nova Sessão de Treinamento'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Registre cada treino executado com séries, reps, carga e RPE.
        </p>
      </div>

      {/* HEADER DA SESSÃO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📋 Cabeçalho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título da sessão</Label>
            <Input
              placeholder="Ex: Manhã — Swing + Goblet + TGU"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label>Data e hora *</Label>
              <Input
                type="datetime-local"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {TIPOS_SESSAO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Local</Label>
              <select
                value={form.local}
                onChange={(e) => setForm({ ...form, local: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {LOCAIS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Parceiro(a)</Label>
              <Input
                placeholder="Opcional"
                value={form.parceiro}
                onChange={(e) => setForm({ ...form, parceiro: e.target.value })}
              />
            </div>
            <div>
              <Label>Duração (min)</Label>
              <Input
                type="number"
                min={1}
                value={form.duracaoMin}
                onChange={(e) => setForm({ ...form, duracaoMin: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>RPE médio (1-10)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                step={0.5}
                value={form.rpeMedio}
                onChange={(e) => setForm({ ...form, rpeMedio: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Distância (km)</Label>
              <Input
                type="number"
                step={0.1}
                min={0}
                value={form.distanciaKm}
                onChange={(e) => setForm({ ...form, distanciaKm: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Calorias</Label>
              <Input
                type="number"
                min={0}
                value={form.calorias}
                onChange={(e) => setForm({ ...form, calorias: Number(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EXERCÍCIOS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            Exercícios ({form.exercicios.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExercicioPicker(!showExercicioPicker)}
            >
              <Search className="h-4 w-4 mr-1" />
              Da biblioteca
            </Button>
            <Button variant="outline" size="sm" onClick={addExercicioCustom}>
              <Plus className="h-4 w-4 mr-1" />
              Custom
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* WORKOUT TIMER - só aparece se houver exercícios */}
          {form.exercicios.length > 0 && (
            <details className="border border-border rounded-lg">
              <summary className="cursor-pointer p-3 text-sm font-medium flex items-center gap-2 hover:bg-accent">
                <Timer className="h-4 w-4 text-emerald-400" />
                🕐 Cronômetro de treino (clique para abrir)
              </summary>
              <div className="p-3 border-t border-border">
                <WorkoutTimer
                  exercicios={form.exercicios.map((ex) => ({
                    nome: ex.nome,
                    descansoSeg: ex.descansoSeg,
                    carga: ex.carga,
                    series: ex.series,
                    reps: ex.reps,
                  }))}
                  onComplete={(stats) => {
                    toast({
                      title: 'Treino finalizado!',
                      description: `Duração: ${Math.floor(stats.duracaoTotalSeg / 60)}min · ${stats.seriesCompletadas} séries`,
                    });
                  }}
                />
              </div>
            </details>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExercicioPicker(!showExercicioPicker)}
            >
              <Search className="h-4 w-4 mr-1" />
              Da biblioteca
            </Button>
            <Button variant="outline" size="sm" onClick={addExercicioCustom}>
              <Plus className="h-4 w-4 mr-1" />
              Custom
            </Button>
          </div>

          {/* BIBLIOTECA KB */}
          {showExercicioPicker && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-3 space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      autoFocus
                      placeholder="Buscar exercício (swing, TGU, snatch...)"
                      value={buscaExercicio}
                      onChange={(e) => setBuscaExercicio(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowExercicioPicker(false);
                      setBuscaExercicio('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-1">
                  {exerciciosFiltrados.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => addExercicioKb(ex)}
                      className="w-full text-left p-2 hover:bg-accent rounded border border-border text-sm"
                    >
                      <div className="font-medium">{ex.nome}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {KETTLEBELL_PATTERNS[ex.padraoKb as PadraoKettlebell]?.nome || ex.padraoKb} ·{' '}
                        {ex.focoPrincipal}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* LISTA DE EXERCÍCIOS */}
          {form.exercicios.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum exercício adicionado.
              <br />
              Use <strong>Da biblioteca</strong> (89 exercícios KB) ou <strong>Custom</strong>.
            </p>
          ) : (
            form.exercicios.map((ex, idx) => (
              <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge variant="outline" className="text-xs">
                      #{idx + 1}
                    </Badge>
                    {ex.padrao && (
                      <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        {ex.padrao}
                      </Badge>
                    )}
                    {ex.isCustom && (
                      <Badge variant="outline" className="text-xs">Custom</Badge>
                    )}
                    <ExerciseBadge
                        id={ex.exercicioId}
                        onShow={showExercise}
                        variant="detailed"
                        className="font-medium"
                      />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveExercicio(idx, -1)}
                      disabled={idx === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveExercicio(idx, 1)}
                      disabled={idx === form.exercicios.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercicio(idx)}
                    >
                      <Trash2 className="h-3 w-3 text-rose-400" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div>
                    <Label className="text-xs">Séries</Label>
                    <Input
                      type="number"
                      min={1}
                      value={ex.series}
                      onChange={(e) => updateExercicio(idx, { series: Number(e.target.value) })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Reps</Label>
                    <Input
                      type="text"
                      value={ex.reps}
                      onChange={(e) => updateExercicio(idx, { reps: e.target.value })}
                      className="h-9"
                      placeholder="10 ou EMOM 5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Carga</Label>
                    <Input
                      type="text"
                      value={ex.carga}
                      onChange={(e) => updateExercicio(idx, { carga: e.target.value })}
                      className="h-9"
                      placeholder="16kg ou BW"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">RPE (1-10)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      step={0.5}
                      value={ex.rpe || ''}
                      onChange={(e) => updateExercicio(idx, { rpe: Number(e.target.value) })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Descanso (s)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={15}
                      value={ex.descansoSeg || ''}
                      onChange={(e) => updateExercicio(idx, { descansoSeg: Number(e.target.value) })}
                      className="h-9"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Notas do exercício</Label>
                  <Input
                    value={ex.notas || ''}
                    onChange={(e) => updateExercicio(idx, { notas: e.target.value })}
                    placeholder="Ex: Forma boa, drop set na última"
                    className="h-9"
                  />
                </div>
              </div>
            ))
          )}

          {form.exercicios.length > 0 && (
            <div className="text-xs text-muted-foreground text-right pt-2">
              📊 Volume estimado: <strong>{volumeTotal.toLocaleString('pt-BR')}</strong> kg × reps
            </div>
          )}
        </CardContent>
      </Card>

      {/* OBSERVAÇÕES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Descrição / Observações
          </CardTitle>
          <CardDescription>
            Como foi a sessão? Sensações, learnings, próximos passos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={5}
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            placeholder="Ex: Joelho D reclamou um pouco no goblet. TGU melhor que semana passada..."
          />
        </CardContent>
      </Card>

      {/* AÇÕES */}
      <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-3 border-t">
        <Button variant="outline" asChild>
          <Link to="/app/treinamento/sessoes">Cancelar</Link>
        </Button>
        <Button onClick={onSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Salvando...' : id ? 'Atualizar' : 'Registrar Sessão'}
        </Button>
      </div>
      {ModalRoot}
    </div>
  );
}
