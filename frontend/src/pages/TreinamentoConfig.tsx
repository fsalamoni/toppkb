/**
 * 🏋️ Treinamento · Configurações
 *
 * Preferências pessoais persistidas em localStorage:
 * - Dias da semana disponíveis
 * - Duração típica por sessão
 * - Tipo de treino preferido (KB / peso corporal / híbrido)
 * - Unidade de carga (kg/lb)
 * - Tema cards visíveis
 * - Som/notificações do timer
 *
 * Sub-rota: /app/treinamento/config
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';
import {
  ChevronLeft, Settings, Save, Calendar, Clock, Dumbbell,
  Bell, Volume2, Eye, RotateCcw, Activity, Heart,
} from 'lucide-react';

interface ConfigTreinamento {
  diasDisponiveis: number[]; // 0=Dom, 1=Seg... 6=Sab
  duracaoMediaMin: number;
  tipoPreferido: 'kb' | 'calistenia' | 'hibrido' | 'pickleball';
  unidadeCarga: 'kg' | 'lb';
  somTimer: boolean;
  notificacoes: boolean;
  cardsVisiveis: {
    composicao: boolean;
    recuperacao: boolean;
    periodo: boolean;
    templates: boolean;
  };
  versao: number;
}

const STORAGE_KEY = 'treinamento-config';
const DEFAULT: ConfigTreinamento = {
  diasDisponiveis: [1, 3, 5], // Seg/Qua/Sex
  duracaoMediaMin: 45,
  tipoPreferido: 'kb',
  unidadeCarga: 'kg',
  somTimer: true,
  notificacoes: true,
  cardsVisiveis: {
    composicao: true,
    recuperacao: true,
    periodo: true,
    templates: true,
  },
  versao: 1,
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function TreinamentoConfig() {
  const [cfg, setCfg] = useState<ConfigTreinamento>(DEFAULT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCfg({ ...DEFAULT, ...parsed });
      }
    } catch (e) {
      console.warn('Falha ao carregar config', e);
    }
  }, []);

  function toggleDia(d: number) {
    setCfg((c) => ({
      ...c,
      diasDisponiveis: c.diasDisponiveis.includes(d)
        ? c.diasDisponiveis.filter((x) => x !== d)
        : [...c.diasDisponiveis, d].sort(),
    }));
  }

  function save() {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      toast({ title: 'Configurações salvas!', variant: 'success' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    if (confirm('Restaurar configurações padrão?')) {
      setCfg(DEFAULT);
      localStorage.removeItem(STORAGE_KEY);
      toast({ title: 'Resetado', description: 'Recarregue a página se precisar.' });
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/app/treinamento">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Treinamento
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-slate-400" />
          Configurações de Treinamento
        </h1>
        <p className="text-muted-foreground mt-1">
          Personalize como o app se adapta à sua rotina e preferências.
        </p>
      </div>

      {/* DIAS DISPONÍVEIS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-400" />
            Dias da Semana Disponíveis
          </CardTitle>
          <CardDescription>
            Quais dias você costuma treinar? Vamos usar pra sugerir planos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {DIAS_SEMANA.map((dia, idx) => {
              const ativo = cfg.diasDisponiveis.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleDia(idx)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    ativo
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-muted/30 border-border hover:border-emerald-500/30'
                  }`}
                >
                  <div className="text-xs uppercase tracking-wider">{dia}</div>
                  <div className="text-lg mt-1">{ativo ? '✓' : '○'}</div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            {cfg.diasDisponiveis.length === 0 ? (
              <span className="text-amber-400">⚠ Nenhum dia selecionado</span>
            ) : cfg.diasDisponiveis.length <= 2 ? (
              <span>{cfg.diasDisponiveis.length}× por semana · Conservador</span>
            ) : cfg.diasDisponiveis.length <= 4 ? (
              <span>{cfg.diasDisponiveis.length}× por semana · Moderado</span>
            ) : (
              <span>{cfg.diasDisponiveis.length}× por semana · Avançado</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DURAÇÃO E TIPO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            Duração & Tipo de Treino
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Duração média por sessão: <span className="text-amber-400">{cfg.duracaoMediaMin} min</span>
            </label>
            <input
              type="range"
              min="15"
              max="120"
              step="5"
              value={cfg.duracaoMediaMin}
              onChange={(e) => setCfg({ ...cfg, duracaoMediaMin: Number(e.target.value) })}
              className="w-full mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>15min (express)</span>
              <span>60min (padrão)</span>
              <span>120min (longo)</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              <Dumbbell className="inline h-4 w-4 mr-1" />
              Tipo Preferido
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([
                { v: 'kb', l: '🏋️ Kettlebell', d: 'Swing, snatch, get-up' },
                { v: 'calistenia', l: '🤸 Calistenia', d: 'Peso corporal' },
                { v: 'hibrido', l: '🔀 Híbrido', d: 'KB + calistenia' },
                { v: 'pickleball', l: '🏓 Pickleball', d: 'Específico do esporte' },
              ] as const).map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setCfg({ ...cfg, tipoPreferido: opt.v })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    cfg.tipoPreferido === opt.v
                      ? 'bg-amber-500/20 border-amber-500/50'
                      : 'bg-muted/30 border-border hover:border-amber-500/30'
                  }`}
                >
                  <div className="font-semibold text-sm">{opt.l}</div>
                  <div className="text-xs text-muted-foreground mt-1">{opt.d}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Unidade de Carga</label>
            <div className="flex gap-2">
              <button
                onClick={() => setCfg({ ...cfg, unidadeCarga: 'kg' })}
                className={`px-4 py-2 rounded-lg border-2 ${
                  cfg.unidadeCarga === 'kg'
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-muted/30 border-border'
                }`}
              >
                Quilo (kg)
              </button>
              <button
                onClick={() => setCfg({ ...cfg, unidadeCarga: 'lb' })}
                className={`px-4 py-2 rounded-lg border-2 ${
                  cfg.unidadeCarga === 'lb'
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-muted/30 border-border'
                }`}
              >
                Libra (lb)
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ÁUDIO E NOTIFICAÇÕES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-400" />
            Áudio & Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Toggle
            icon={Volume2}
            label="Som do cronômetro"
            desc="Beeps quando o descanso termina"
            checked={cfg.somTimer}
            onChange={(v) => setCfg({ ...cfg, somTimer: v })}
          />
          <Toggle
            icon={Bell}
            label="Notificações"
            desc="Lembretes de treino e metas"
            checked={cfg.notificacoes}
            onChange={(v) => setCfg({ ...cfg, notificacoes: v })}
          />
        </CardContent>
      </Card>

      {/* CARDS VISÍVEIS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-5 w-5 text-emerald-400" />
            Cards no Dashboard
          </CardTitle>
          <CardDescription>
            Quais cards rápidos aparecem na visão geral.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Toggle
            icon={Activity as any}
            label="Composição corporal"
            desc="Peso, % gordura, IMC"
            checked={cfg.cardsVisiveis.composicao}
            onChange={(v) => setCfg({ ...cfg, cardsVisiveis: { ...cfg.cardsVisiveis, composicao: v } })}
          />
          <Toggle
            icon={Heart as any}
            label="Recuperação"
            desc="Score + intensidade recomendada"
            checked={cfg.cardsVisiveis.recuperacao}
            onChange={(v) => setCfg({ ...cfg, cardsVisiveis: { ...cfg.cardsVisiveis, recuperacao: v } })}
          />
          <Toggle
            icon={Calendar as any}
            label="Período ativo"
            desc="Qual semana da periodização"
            checked={cfg.cardsVisiveis.periodo}
            onChange={(v) => setCfg({ ...cfg, cardsVisiveis: { ...cfg.cardsVisiveis, periodo: v } })}
          />
          <Toggle
            icon={Dumbbell}
            label="Templates favoritos"
            desc="Acesso rápido a templates"
            checked={cfg.cardsVisiveis.templates}
            onChange={(v) => setCfg({ ...cfg, cardsVisiveis: { ...cfg.cardsVisiveis, templates: v } })}
          />
        </CardContent>
      </Card>

      {/* AÇÕES */}
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving} className="flex-1">
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </Button>
        <Button onClick={reset} variant="outline">
          <RotateCcw className="h-4 w-4 mr-1" />
          Resetar
        </Button>
      </div>
    </div>
  );
}

function Toggle({ icon: Icon, label, desc, checked, onChange }: {
  icon: any;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent text-left"
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-muted'} relative`}>
        <div className={`absolute top-0.5 ${checked ? 'right-0.5' : 'left-0.5'} w-5 h-5 rounded-full bg-white transition-all`} />
      </div>
    </button>
  );
}
