/**
 * 🏋️ Treinamento · Meu Programa · ABA: SETUP (4 passos + revisão)
 *
 * Wizard de configuração do plano de treino. Extraído do
 * TreinamentoMeuPrograma.tsx em Sprint 3 para reduzir de 1397 → ~1100 linhas.
 *
 * 4 passos:
 *   1. OBJETIVO (forca_geral | hipertrofia | perda_peso | mobilidade | etc)
 *   2. ROTINA (duração em semanas + sessões/semana + min/sessão)
 *   3. EQUIPAMENTO E NÍVEL (kb | academia | peso corporal | etc)
 *   4. REVISAR (preview + confirmar)
 *
 * Gera plano on-the-fly com `gerarPlano(form)` (memo).
 */
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChevronRight, Sparkles, Dumbbell, Target,
} from 'lucide-react';
import {
  gerarPlano, OBJETIVOS_LABEL, OBJETIVOS_ICONE,
} from '@/lib/geradorPlano';
import type { Plano, PlanoInput, Objetivo, Nivel, Equipamento } from '@/lib/geradorPlano';

interface SetupTabProps {
  onCriar: (p: Plano) => void;
  saving: boolean;
}

export function SetupTab({ onCriar, saving }: SetupTabProps) {
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

  const preview = useMemo(() => {
    try {
      return gerarPlano(form);
    } catch {
      return null;
    }
  }, [form]);

  // ... (todo o conteúdo das linhas 388-689 continua aqui)
  // Por brevidade, vou manter o conteúdo anterior aqui:

  const isStepValid = useMemo(() => {
    if (step === 1) return !!form.objetivo;
    if (step === 2) return form.sessoesPorSemana >= 2 && form.duracaoSessaoMin >= 20 && form.duracaoSemanas >= 4;
    if (step === 3) return !!form.nivel && !!form.equipamento;
    return true;
  }, [step, form]);

  return (
    <div className="space-y-4">
      {/* ONBOARDING: Explicação inicial só na primeira vez (sem plano) */}
      {step === 1 && (
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Como funciona o Meu Programa</div>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Você define <strong>objetivo</strong>, <strong>frequência</strong> e <strong>nível</strong></li>
                  <li>A gente gera um plano de treino personalizado (sessões, séries, reps)</li>
                  <li>Você segue e marca cada sessão como feita com 1 clique</li>
                  <li>Acompanhe sua <strong>aderência</strong> e <strong>progresso</strong> ao longo das semanas</li>
                </ol>
                <div className="text-xs text-muted-foreground mt-2">
                  💡 <strong>Dica:</strong> o plano é seu — pode pular sessões, ajustar exercícios ou trocar de objetivo a qualquer momento.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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


/**
 * Stat — sub-componente privado do SetupTab para KPIs do preview.
 */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-semibold text-sm capitalize">{value}</div>
    </div>
  );
}
