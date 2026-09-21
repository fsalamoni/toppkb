/**
 * 🏋️ Treinamento · Composição Corporal
 *
 * Tracking de:
 * - Peso (kg)
 * - % gordura
 * - Massa magra (kg)
 * - Circunferências (cintura, quadril, peito, braço, coxa)
 * - IMC calculado automaticamente
 *
 * Sub-rota: /app/treinamento/composicao
 *
 * Coleção: toppkb_users/{uid}/treinamento/composicao/
 */

import { treinoCol, treinoDoc } from '@/lib/firestorePaths';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  query, orderBy, getDocs, addDoc, deleteDoc, serverTimestamp,
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
  ChevronLeft, Plus, Trash2, Activity, TrendingUp, TrendingDown,
  Ruler, Weight, Calendar, Save,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatDate } from '@/lib/utils';
import { calcularIMC, classificarIMC } from '@/lib/utils';

interface Medida {
  id: string;
  data: string;
  peso?: number;
  altura?: number;
  percentualGordura?: number;
  massaMagra?: number;
  massaGorda?: number;
  circunferenciaCintura?: number;
  circunferenciaQuadril?: number;
  circunferenciaPeito?: number;
  circunferenciaBraco?: number;
  circunferenciaCoxa?: number;
  observacoes?: string;
  createdAt?: any;
}

export function TreinamentoComposicao() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: medidas, isLoading } = useQuery({
    queryKey: ['treinamento-composicao', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        treinoCol(db, user.uid, 'composicao'),
        orderBy('data', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Medida));
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(treinoDoc(db, user.uid, 'composicao', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['treinamento-composicao'] });
      toast({ title: 'Medida removida', variant: 'success' });
    },
  });

  // Stats
  const stats = useMemo(() => {
    const arr = medidas || [];
    if (arr.length === 0) return null;

    const atual = arr[0];
    const anterior = arr[1];

    function diff(atual: number | undefined, anterior: number | undefined) {
      if (!atual || !anterior) return null;
      return atual - anterior;
    }

    return {
      atual,
      anterior,
      diffPeso: diff(atual.peso, anterior?.peso),
      diffGordura: diff(atual.percentualGordura, anterior?.percentualGordura),
      diffMassaMagra: diff(atual.massaMagra, anterior?.massaMagra),
      diffCintura: diff(atual.circunferenciaCintura, anterior?.circunferenciaCintura),
    };
  }, [medidas]);

  // Dados para gráficos
  const dadosGrafico = useMemo(() => {
    if (!medidas) return [];
    return [...medidas]
      .reverse()
      .map((m) => ({
        data: formatDate(m.data).slice(0, 5),
        peso: m.peso,
        percentualGordura: m.percentualGordura,
        massaMagra: m.massaMagra,
        cintura: m.circunferenciaCintura,
      }));
  }, [medidas]);

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
            <Activity className="h-8 w-8 text-cyan-400" />
            Composição Corporal
          </h1>
          <p className="text-muted-foreground mt-1">
            Peso, % gordura, massa magra e circunferências ao longo do tempo.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          {showForm ? 'Cancelar' : 'Nova Medida'}
        </Button>
      </div>

      {/* FORM */}
      {showForm && (
        <ComposicaoForm
          ultimaMedida={stats?.atual}
          onSaved={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ['treinamento-composicao'] });
          }}
        />
      )}

      {(!medidas || medidas.length === 0) && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Weight className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-3">
              Nenhuma medida registrada ainda.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Registrar primeira medida
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiComposicao
                label="Peso atual"
                valor={stats.atual.peso ? `${stats.atual.peso} kg` : '—'}
                diff={stats.diffPeso}
                unidade="kg"
                icone={Weight}
                accent="blue"
                imc={stats.atual.peso && stats.atual.altura ? calcularIMC(stats.atual.peso, stats.atual.altura) : null}
              />
              <KpiComposicao
                label="% Gordura"
                valor={stats.atual.percentualGordura ? `${stats.atual.percentualGordura}%` : '—'}
                diff={stats.diffGordura}
                unidade="%"
                icone={TrendingDown}
                accent="amber"
              />
              <KpiComposicao
                label="Massa magra"
                valor={stats.atual.massaMagra ? `${stats.atual.massaMagra.toFixed(1)} kg` : '—'}
                diff={stats.diffMassaMagra}
                unidade="kg"
                icone={TrendingUp}
                accent="emerald"
              />
              <KpiComposicao
                label="Cintura"
                valor={stats.atual.circunferenciaCintura ? `${stats.atual.circunferenciaCintura} cm` : '—'}
                diff={stats.diffCintura}
                unidade="cm"
                icone={Ruler}
                accent="rose"
              />
            </div>
          )}

          {/* GRÁFICOS */}
          {dadosGrafico.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Weight className="h-5 w-5 text-blue-400" />
                    Peso × % Gordura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="data" stroke="#888" fontSize={11} />
                      <YAxis yAxisId="left" stroke="#3b82f6" fontSize={11} />
                      <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '6px' }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="peso" stroke="#3b82f6" name="Peso (kg)" strokeWidth={2} dot={{ r: 3 }} />
                      <Line yAxisId="right" type="monotone" dataKey="percentualGordura" stroke="#f59e0b" name="% Gordura" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Massa Magra × Cintura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="data" stroke="#888" fontSize={11} />
                      <YAxis yAxisId="left" stroke="#10b981" fontSize={11} />
                      <YAxis yAxisId="right" orientation="right" stroke="#ec4899" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '6px' }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="massaMagra" stroke="#10b981" name="Massa Magra (kg)" strokeWidth={2} dot={{ r: 3 }} />
                      <Line yAxisId="right" type="monotone" dataKey="cintura" stroke="#ec4899" name="Cintura (cm)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* HISTÓRICO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Histórico ({medidas?.length || 0} registros)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(medidas || []).map((m) => {
                const imc = m.peso && m.altura ? calcularIMC(m.peso, m.altura) : null;
                const imcClass = imc ? classificarIMC(imc) : null;
                return (
                  <div key={m.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatDate(m.data)}</span>
                        {imc && (
                          <Badge variant="outline" className={`text-xs ${imcClass?.cor}`}>
                            IMC {imc.toFixed(1)} · {imcClass?.label}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Remover esta medida?')) del.mutate(m.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-rose-400" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-7 gap-2 text-xs">
                      <Medida label="Peso" valor={m.peso} unidade="kg" />
                      <Medida label="% Gordura" valor={m.percentualGordura} unidade="%" />
                      <Medida label="Massa Magra" valor={m.massaMagra} unidade="kg" />
                      <Medida label="Cintura" valor={m.circunferenciaCintura} unidade="cm" />
                      <Medida label="Quadril" valor={m.circunferenciaQuadril} unidade="cm" />
                      <Medida label="Peito" valor={m.circunferenciaPeito} unidade="cm" />
                      <Medida label="Braço" valor={m.circunferenciaBraco} unidade="cm" />
                    </div>
                    {m.observacoes && (
                      <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        💬 {m.observacoes}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function KpiComposicao({ label, valor, diff, unidade, icone: Icon, accent, imc }: any) {
  const accentMap: Record<string, string> = {
    blue: 'text-blue-400 border-blue-500/30',
    amber: 'text-amber-400 border-amber-500/30',
    emerald: 'text-emerald-400 border-emerald-500/30',
    rose: 'text-rose-400 border-rose-500/30',
  };
  const accentClass = accentMap[accent as string] || accentMap.emerald;

  return (
    <Card className={`border ${accentClass.split(' ')[1]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <Icon className={`h-4 w-4 ${accentClass.split(' ')[0]}`} />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
        <div className={`text-2xl font-bold ${accentClass.split(' ')[0]}`}>
          {valor}
        </div>
        {diff !== null && diff !== undefined && (
          <div className={`text-xs mt-1 ${diff === 0 ? 'text-muted-foreground' : diff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {diff === 0 ? '=' : diff > 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)} {unidade}
          </div>
        )}
        {imc && (
          <div className="text-[10px] text-muted-foreground mt-0.5">
            IMC: {imc.toFixed(1)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Medida({ label, valor, unidade }: { label: string; valor?: number; unidade: string }) {
  return (
    <div className="bg-muted/30 rounded p-1.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-xs font-medium">
        {valor ? `${valor} ${unidade}` : '—'}
      </div>
    </div>
  );
}

function ComposicaoForm({
  ultimaMedida,
  onSaved,
}: {
  ultimaMedida?: Medida;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    peso: ultimaMedida?.peso || 0,
    altura: ultimaMedida?.altura || 175,
    percentualGordura: ultimaMedida?.percentualGordura || 0,
    massaMagra: ultimaMedida?.massaMagra || 0,
    circunferenciaCintura: ultimaMedida?.circunferenciaCintura || 0,
    circunferenciaQuadril: ultimaMedida?.circunferenciaQuadril || 0,
    circunferenciaPeito: ultimaMedida?.circunferenciaPeito || 0,
    circunferenciaBraco: ultimaMedida?.circunferenciaBraco || 0,
    circunferenciaCoxa: ultimaMedida?.circunferenciaCoxa || 0,
    observacoes: '',
  });
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!user) return;
    if (!form.peso) {
      toast({ title: 'Informe o peso', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        peso: Number(form.peso),
        altura: Number(form.altura),
        percentualGordura: Number(form.percentualGordura) || null,
        massaMagra: form.massaMagra
          ? Number(form.massaMagra)
          : form.percentualGordura && form.peso
          ? Number((form.peso * (1 - form.percentualGordura / 100)).toFixed(1))
          : null,
        massaGorda: form.percentualGordura && form.peso
          ? Number((form.peso * (form.percentualGordura / 100)).toFixed(1))
          : null,
        circunferenciaCintura: Number(form.circunferenciaCintura) || null,
        circunferenciaQuadril: Number(form.circunferenciaQuadril) || null,
        circunferenciaPeito: Number(form.circunferenciaPeito) || null,
        circunferenciaBraco: Number(form.circunferenciaBraco) || null,
        circunferenciaCoxa: Number(form.circunferenciaCoxa) || null,
        createdAt: serverTimestamp(),
      };

      await addDoc(
        treinoCol(db, user.uid, 'composicao'),
        payload,
      );
      toast({ title: 'Medida registrada!', variant: 'success' });
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
        <CardTitle className="text-base">📊 Nova Medida</CardTitle>
        <CardDescription>
          Preencha ao menos o peso. Demais campos são opcionais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label>Data *</Label>
            <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </div>
          <div>
            <Label>Peso (kg) *</Label>
            <Input type="number" step={0.1} value={form.peso} onChange={(e) => setForm({ ...form, peso: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Altura (cm)</Label>
            <Input type="number" value={form.altura} onChange={(e) => setForm({ ...form, altura: Number(e.target.value) })} />
          </div>
          <div>
            <Label>% Gordura</Label>
            <Input type="number" step={0.1} value={form.percentualGordura || ''} onChange={(e) => setForm({ ...form, percentualGordura: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Massa Magra (kg)</Label>
            <Input type="number" step={0.1} value={form.massaMagra || ''} onChange={(e) => setForm({ ...form, massaMagra: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Cintura (cm)</Label>
            <Input type="number" step={0.1} value={form.circunferenciaCintura || ''} onChange={(e) => setForm({ ...form, circunferenciaCintura: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Quadril (cm)</Label>
            <Input type="number" step={0.1} value={form.circunferenciaQuadril || ''} onChange={(e) => setForm({ ...form, circunferenciaQuadril: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Peito (cm)</Label>
            <Input type="number" step={0.1} value={form.circunferenciaPeito || ''} onChange={(e) => setForm({ ...form, circunferenciaPeito: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Braço (cm)</Label>
            <Input type="number" step={0.1} value={form.circunferenciaBraco || ''} onChange={(e) => setForm({ ...form, circunferenciaBraco: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Coxa (cm)</Label>
            <Input type="number" step={0.1} value={form.circunferenciaCoxa || ''} onChange={(e) => setForm({ ...form, circunferenciaCoxa: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <Label>Observações</Label>
          <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Ex: medido em jejum, balança digital..." />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onSaved}>Cancelar</Button>
          <Button onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
