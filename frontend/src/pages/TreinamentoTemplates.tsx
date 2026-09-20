/**
 * 🏋️ Treinamento · Templates de Sessão
 *
 * CRUD para criar templates de sessão reutilizáveis.
 * Permite salvar uma sessão recorrente (ex: "Segunda: Push")
 * e reaplicar com 1 clique no form de nova sessão.
 *
 * Sub-rota: /app/treinamento/templates
 *
 * Coleção: toppkb_users/{uid}/treinamento/templates/
 */

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection, query, orderBy, getDocs, deleteDoc, doc, setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toaster';
import {
  ChevronLeft, Plus, Trash2, Edit, Copy, FileText,
  Play, Save, X,
} from 'lucide-react';
import {
  KETTLEBELL_EXERCICIOS,
} from '@/data/seed/exercicios-kettlebell';

interface SerieTemplate {
  exercicioId: string;
  nome: string;
  padrao?: string;
  series: number;
  reps: number | string;
  carga: string;
  rpe?: number;
  descansoSeg?: number;
  notas?: string;
}

interface Template {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  duracaoEstimadaMin?: number;
  exercicios: SerieTemplate[];
  diaSemana?: number; // 0-6 (domingo-sábado)
  ativo?: boolean;
  vezesUsado?: number;
  ultimoUso?: string;
  createdAt?: any;
}

export function TreinamentoTemplates() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['treinamento-templates', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'treinamento', 'templates'),
        orderBy('createdAt', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Template));
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'treinamento', 'templates', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['treinamento-templates'] });
      toast({ title: 'Template removido', variant: 'success' });
    },
  });

  const duplicar = useMutation({
    mutationFn: async (t: Template) => {
      if (!user) return;
      const novo = {
        ...t,
        nome: `${t.nome} (cópia)`,
        vezesUsado: 0,
        ultimoUso: null,
        createdAt: serverTimestamp(),
      };
      delete (novo as any).id;
      const ref = doc(collection(db, 'toppkb_users', user.uid, 'treinamento', 'templates'));
      await setDoc(ref, novo);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['treinamento-templates'] });
      toast({ title: 'Template duplicado', variant: 'success' });
    },
  });

  const aplicarTemplate = (t: Template) => {
    // Salva no localStorage pra TreinamentoSessoesForm pegar
    localStorage.setItem('treinamento-template-aplicar', JSON.stringify(t));
    // Incrementa contador
    if (user) {
      setDoc(
        doc(db, 'toppkb_users', user.uid, 'treinamento', 'templates', t.id),
        {
          vezesUsado: (t.vezesUsado || 0) + 1,
          ultimoUso: new Date().toISOString(),
        },
        { merge: true },
      );
    }
    navigate('/app/treinamento/sessoes/nova');
  };

  // Hooks sempre chamados (regras do React)
  const stats = useMemo(() => {
    const arr = templates || [];
    return {
      total: arr.length,
      usados: arr.filter((t) => (t.vezesUsado || 0) > 0).length,
      totalUsos: arr.reduce((acc, t) => acc + (t.vezesUsado || 0), 0),
    };
  }, [templates]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/app/treinamento">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Treinamento
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-amber-400" />
            Templates de Sessão
          </h1>
          <p className="text-muted-foreground mt-1">
            Salve sessões recorrentes e aplique em 1 clique.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          {showForm ? 'Cancelar' : 'Novo Template'}
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Total</div>
            <div className="text-2xl font-bold text-amber-400">{stats.total}</div>
            <div className="text-xs text-muted-foreground">templates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Em uso</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.usados}</div>
            <div className="text-xs text-muted-foreground">aplicados 1+ vezes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Total de usos</div>
            <div className="text-2xl font-bold text-blue-400">{stats.totalUsos}</div>
            <div className="text-xs text-muted-foreground">sessões a partir de templates</div>
          </CardContent>
        </Card>
      </div>

      {/* FORM */}
      {showForm && (
        <TemplateForm
          templateId={editandoId}
          onClose={() => {
            setShowForm(false);
            setEditandoId(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditandoId(null);
            qc.invalidateQueries({ queryKey: ['treinamento-templates'] });
          }}
        />
      )}

      {/* LISTA */}
      {!templates || templates.length === 0 ? (
        <EmptyState
          icone="📋"
          titulo="Nenhum template ainda"
          descricao="Crie seu primeiro template para reutilizar sessões"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onAplicar={() => aplicarTemplate(t)}
              onDuplicar={() => duplicar.mutate(t)}
              onEditar={() => {
                setEditandoId(t.id);
                setShowForm(true);
              }}
              onRemover={() => {
                if (confirm(`Remover template "${t.nome}"?`)) {
                  del.mutate(t.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  onAplicar: () => void;
  onDuplicar: () => void;
  onEditar: () => void;
  onRemover: () => void;
}

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function TemplateCard({ template: t, onAplicar, onDuplicar, onEditar, onRemover }: TemplateCardProps) {
  return (
    <Card className="hover:border-emerald-500/50 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="font-semibold text-base">{t.nome}</div>
            {t.diaSemana !== undefined && t.diaSemana >= 0 && (
              <div className="text-xs text-muted-foreground">
                📅 {DIAS_SEMANA[t.diaSemana]}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {t.tipo && (
              <Badge variant="outline" className="capitalize text-xs">
                {t.tipo}
              </Badge>
            )}
            {t.vezesUsado !== undefined && t.vezesUsado > 0 && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                {t.vezesUsado}× usado
              </Badge>
            )}
          </div>
        </div>

        {t.descricao && (
          <div className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {t.descricao}
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
          {t.duracaoEstimadaMin && <span>⏱ {t.duracaoEstimadaMin}min</span>}
          <span>📦 {t.exercicios?.length || 0} exercícios</span>
        </div>

        {/* Preview dos exercícios */}
        {t.exercicios && t.exercicios.length > 0 && (
          <div className="space-y-1 mb-3 text-xs">
            {t.exercicios.slice(0, 4).map((ex, i) => (
              <div key={i} className="flex items-center justify-between text-muted-foreground">
                <span className="truncate">{ex.nome}</span>
                <span className="text-xs">{ex.series}×{ex.reps}</span>
              </div>
            ))}
            {t.exercicios.length > 4 && (
              <div className="text-xs text-muted-foreground">
                +{t.exercicios.length - 4} mais
              </div>
            )}
          </div>
        )}

        <div className="flex gap-1">
          <Button onClick={onAplicar} size="sm" className="flex-1">
            <Play className="h-3 w-3 mr-1" />
            Aplicar
          </Button>
          <Button onClick={onDuplicar} size="sm" variant="outline">
            <Copy className="h-3 w-3" />
          </Button>
          <Button onClick={onEditar} size="sm" variant="outline">
            <Edit className="h-3 w-3" />
          </Button>
          <Button onClick={onRemover} size="sm" variant="ghost">
            <Trash2 className="h-3 w-3 text-rose-400" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// FORM de criação/edição
function TemplateForm({
  templateId,
  onClose,
  onSaved,
}: {
  templateId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('kettlebell');
  const [diaSemana, setDiaSemana] = useState<number>(-1);
  const [duracaoEstimadaMin, setDuracaoEstimadaMin] = useState(45);
  const [exercicios, setExercicios] = useState<SerieTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  // Carrega template se editando
  useState(() => {
    if (templateId && user) {
      (async () => {
        const snap = await getDocs(query(collection(db, 'toppkb_users', user.uid, 'treinamento', 'templates')));
        const t = snap.docs.find((d) => d.id === templateId);
        if (t) {
          const data = t.data() as Template;
          setNome(data.nome || '');
          setDescricao(data.descricao || '');
          setTipo(data.tipo || 'kettlebell');
          setDiaSemana(data.diaSemana ?? -1);
          setDuracaoEstimadaMin(data.duracaoEstimadaMin || 45);
          setExercicios(data.exercicios || []);
        }
      })();
    }
  });

  function addEx(ex: typeof KETTLEBELL_EXERCICIOS[number]) {
    setExercicios([
      ...exercicios,
      {
        exercicioId: ex.id,
        nome: ex.nome,
        padrao: ex.padraoKb,
        series: 3,
        reps: 10,
        carga: ex.equipamento === 'peso-corporal' || ex.equipamento === 'nenhum' ? 'BW' : '— kg',
        rpe: 7,
        descansoSeg: 90,
      },
    ]);
    setShowPicker(false);
    setBusca('');
  }

  function removeEx(idx: number) {
    setExercicios(exercicios.filter((_, i) => i !== idx));
  }

  function moveEx(idx: number, dir: -1 | 1) {
    const novoIdx = idx + dir;
    if (novoIdx < 0 || novoIdx >= exercicios.length) return;
    const novo = [...exercicios];
    [novo[idx], novo[novoIdx]] = [novo[novoIdx], novo[idx]];
    setExercicios(novo);
  }

  function updateEx(idx: number, patch: Partial<SerieTemplate>) {
    const novo = [...exercicios];
    novo[idx] = { ...novo[idx], ...patch };
    setExercicios(novo);
  }

  const exerciciosFiltrados = useMemo(() => {
    if (!busca) return KETTLEBELL_EXERCICIOS.slice(0, 30);
    const q = busca.toLowerCase();
    return KETTLEBELL_EXERCICIOS.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        e.descricao.toLowerCase().includes(q),
    ).slice(0, 30);
  }, [busca]);

  async function onSave() {
    if (!user) return;
    if (!nome.trim()) {
      toast({ title: 'Dê um nome ao template', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome,
        descricao,
        tipo,
        diaSemana: diaSemana >= 0 ? diaSemana : null,
        duracaoEstimadaMin,
        exercicios,
        updatedAt: serverTimestamp(),
      };

      if (templateId) {
        await setDoc(
          doc(db, 'toppkb_users', user.uid, 'treinamento', 'templates', templateId),
          payload,
          { merge: true },
        );
      } else {
        await setDoc(
          doc(collection(db, 'toppkb_users', user.uid, 'treinamento', 'templates')),
          { ...payload, vezesUsado: 0, createdAt: serverTimestamp() },
        );
      }
      toast({ title: 'Template salvo!', variant: 'success' });
      onSaved();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {templateId ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {templateId ? 'Editar Template' : 'Novo Template'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Nome *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Segunda - Push A"
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="kettlebell">Kettlebell</option>
              <option value="forca">Força</option>
              <option value="hipertrofia">Hipertrofia</option>
              <option value="potencia">Potência</option>
              <option value="mobilidade">Mobilidade</option>
              <option value="misto">Misto</option>
            </select>
          </div>
          <div>
            <Label>Dia da semana (opcional)</Label>
            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(Number(e.target.value))}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value={-1}>Nenhum</option>
              {DIAS_SEMANA.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Duração estimada (min)</Label>
            <Input
              type="number"
              value={duracaoEstimadaMin}
              onChange={(e) => setDuracaoEstimadaMin(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <Label>Descrição</Label>
          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Para que serve, quando usar..."
            rows={2}
          />
        </div>

        {/* EXERCÍCIOS */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <Label>Exercícios ({exercicios.length})</Label>
            <Button size="sm" variant="outline" onClick={() => setShowPicker(!showPicker)}>
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </div>

          {showPicker && (
            <div className="mb-3 border border-border rounded p-2 bg-muted/30">
              <Input
                autoFocus
                placeholder="Buscar exercício..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {exerciciosFiltrados.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => addEx(ex)}
                    className="w-full text-left p-2 hover:bg-accent rounded text-sm border border-border"
                  >
                    <div className="font-medium">{ex.nome}</div>
                    <div className="text-xs text-muted-foreground">{ex.focoPrincipal}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {exercicios.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum exercício. Adicione para começar.
            </p>
          ) : (
            <div className="space-y-2">
              {exercicios.map((ex, idx) => (
                <div key={idx} className="border border-border rounded p-2 text-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium truncate flex-1">
                      #{idx + 1} {ex.nome}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => moveEx(idx, -1)} disabled={idx === 0}>
                        ↑
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => moveEx(idx, 1)} disabled={idx === exercicios.length - 1}>
                        ↓
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeEx(idx)}>
                        <X className="h-3 w-3 text-rose-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    <div>
                      <Label className="text-xs">Séries</Label>
                      <Input
                        type="number"
                        value={ex.series}
                        onChange={(e) => updateEx(idx, { series: Number(e.target.value) })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Reps</Label>
                      <Input
                        value={ex.reps}
                        onChange={(e) => updateEx(idx, { reps: e.target.value })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Carga</Label>
                      <Input
                        value={ex.carga}
                        onChange={(e) => updateEx(idx, { carga: e.target.value })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">RPE</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={ex.rpe || ''}
                        onChange={(e) => updateEx(idx, { rpe: Number(e.target.value) })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Desc s</Label>
                      <Input
                        type="number"
                        value={ex.descansoSeg || ''}
                        onChange={(e) => updateEx(idx, { descansoSeg: Number(e.target.value) })}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Salvando...' : templateId ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
