import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ChevronRight, ChevronLeft, Calendar,
  AlertTriangle, Flame, Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PERIODIZACAO_TEMPLATES,
  MESOCICLO_DESCRICOES,
  type NivelPeriodizacao,
  type SessaoTreino,
} from '@/data/seed/periodizacao-templates';
import { KETTLEBELL_EXERCICIOS } from '@/data/seed/exercicios-kettlebell';

export function Periodizacao() {
  const [nivelSelecionado, setNivelSelecionado] = useState<NivelPeriodizacao | null>(null);
  const [semanaAtual, setSemanaAtual] = useState(1);
  const [sessaoSelecionada, setSessaoSelecionada] = useState<SessaoTreino | null>(null);

  const template = nivelSelecionado ? PERIODIZACAO_TEMPLATES[nivelSelecionado] : null;
  const semana = template?.semanas.find((s) => s.semana === semanaAtual);

  if (!nivelSelecionado || !template) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-emerald-400" />
            Periodização
          </h1>
          <p className="text-muted-foreground mt-1">
            Planos de 12 semanas baseados em ciência. Escolha o template ideal pro seu objetivo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.values(PERIODIZACAO_TEMPLATES) as Array<typeof PERIODIZACAO_TEMPLATES[NivelPeriodizacao]>).map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:border-emerald-500/50 hover:shadow-lg transition-all"
              onClick={() => setNivelSelecionado(t.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-3xl">{t.icone}</span>
                  {t.nome}
                </CardTitle>
                <CardDescription>{t.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Frequência</span>
                  <span className="font-medium">{t.diasPorSemana}x / semana</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duração</span>
                  <span className="font-medium">{t.duracaoTotalSemanas} semanas</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Público</span>
                  <span className="font-medium text-right text-xs">{t.publicoAlvo}</span>
                </div>
                {t.contraindicacoes && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded p-2 text-xs">
                    <div className="font-semibold text-rose-400 mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Contraindicações
                    </div>
                    <ul className="space-y-0.5 text-rose-300">
                      {t.contraindicacoes.map((c, i) => (
                        <li key={i}>• {c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button className="w-full mt-2" size="sm">
                  Ver Plano Completo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* EVIDÊNCIAS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-blue-400" />
              Base Científica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Todos os templates seguem periodização por blocos (Helms 2019),
              com deloads a cada 4 semanas (Coleman 2024: 6.4±1.7 dias a cada 5.6±2.3 sem),
              e progressão baseada em RPE.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="text-xs">Issurin 2010</Badge>
              <Badge variant="outline" className="text-xs">Helms 2019</Badge>
              <Badge variant="outline" className="text-xs">Coleman 2024</Badge>
              <Badge variant="outline" className="text-xs">Bell 2024</Badge>
              <Badge variant="outline" className="text-xs">Tsatsouline 2019</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Visualização do plano
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNivelSelecionado(null)}
            className="mb-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Trocar template
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-4xl">{template.icone}</span>
            {template.nome}
          </h1>
          <p className="text-muted-foreground mt-1">{template.descricao}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/app/preparacao/nova">
            <Flame className="h-4 w-4 mr-1" />
            Registrar Sessão
          </Link>
        </Button>
      </div>

      {/* MACRO OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['acumulacao', 'intensificacao', 'realizacao'] as const).map((m) => {
          const semanas = template.semanas.filter((s) => s.mesociclo === m);
          if (semanas.length === 0) return null;
          return (
            <Card key={m}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium uppercase tracking-wide">
                  {MESOCICLO_DESCRICOES[m].split(' — ')[0]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">
                  {MESOCICLO_DESCRICOES[m].split(' — ')[1]}
                </p>
                <div className="flex flex-wrap gap-1">
                  {semanas.map((s) => (
                    <Badge key={s.semana} variant="outline" className="text-xs">
                      Sem {s.semana}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* TIMELINE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-400" />
            Linha do Tempo · 12 Semanas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {template.semanas.map((s) => (
              <button
                key={s.semana}
                onClick={() => setSemanaAtual(s.semana)}
                className={`flex-shrink-0 p-2 rounded border min-w-[70px] transition-all ${
                  semanaAtual === s.semana
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : s.isDeload
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : s.mesociclo === 'acumulacao'
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : s.mesociclo === 'intensificacao'
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-rose-500/30 bg-rose-500/5'
                }`}
              >
                <div className="text-xs text-muted-foreground">Sem</div>
                <div className="font-bold text-lg">{s.semana}</div>
                <div className="text-[10px] mt-1 capitalize">{s.mesociclo.slice(0, 4)}</div>
                {s.isDeload && <div className="text-[10px] text-blue-400">deload</div>}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SEMANA ATUAL */}
      {semana && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Semana {semana.semana}
                  {semana.isDeload && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      Deload
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Volume {semana.volume} · Intensidade {semana.intensidade} ·{' '}
                  {MESOCICLO_DESCRICOES[semana.mesociclo].split(' — ')[0]}
                </CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={semanaAtual === 1}
                  onClick={() => setSemanaAtual(Math.max(1, semanaAtual - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={semanaAtual === 12}
                  onClick={() => setSemanaAtual(Math.min(12, semanaAtual + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {semana.sessoes.map((sessao) => (
              <SessaoCard
                key={sessao.dia}
                sessao={sessao}
                onClick={() => setSessaoSelecionada(sessao)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* DETALHE DA SESSÃO */}
      {sessaoSelecionada && (
        <SessaoDetail
          sessao={sessaoSelecionada}
          semana={semanaAtual}
          templateId={template.id}
          onClose={() => setSessaoSelecionada(null)}
        />
      )}
    </div>
  );
}

function SessaoCard({ sessao, onClick }: { sessao: SessaoTreino; onClick: () => void }) {
  const diaLabel = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][sessao.dia - 1];
  const totalSeries = sessao.exercicios.reduce((acc, ex) => acc + ex.series, 0);

  return (
    <div
      className="p-4 border border-border rounded-lg cursor-pointer hover:border-emerald-500/50 hover:bg-accent/50 transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs text-muted-foreground">Dia {sessao.dia} · {diaLabel}</div>
          <div className="font-semibold">{sessao.nome}</div>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="text-xs">
            ⏱ {sessao.duracaoMin}min
          </Badge>
          <Badge variant="outline" className="text-xs">
            {totalSeries} séries
          </Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {sessao.foco.map((p) => (
          <Badge key={p} className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            {p}
          </Badge>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        {sessao.exercicios.length} exercícios: {sessao.exercicios.map((e) => {
          const ex = KETTLEBELL_EXERCICIOS.find((x) => x.id === e.exercicioId);
          return ex?.nome || e.exercicioId;
        }).join(' · ')}
      </div>
    </div>
  );
}

function SessaoDetail({
  sessao, semana, templateId, onClose,
}: {
  sessao: SessaoTreino;
  semana: number;
  templateId: NivelPeriodizacao;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Badge className="mb-2 text-xs">Semana {semana} · {templateId}</Badge>
              <h2 className="text-2xl font-bold">{sessao.nome}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {sessao.duracaoMin} min · {sessao.exercicios.length} exercícios ·{' '}
                {sessao.exercicios.reduce((acc, e) => acc + e.series, 0)} séries
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* EXERCÍCIOS */}
          <div className="space-y-3">
            {sessao.exercicios.map((ex, idx) => {
              const exercicio = KETTLEBELL_EXERCICIOS.find((x) => x.id === ex.exercicioId);
              return (
                <div
                  key={idx}
                  className="border border-border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                        <h3 className="font-semibold">
                          {exercicio?.nome || ex.exercicioId}
                        </h3>
                      </div>
                      {exercicio?.focoPrincipal && (
                        <p className="text-xs text-emerald-400 mt-0.5">
                          🎯 {exercicio.focoPrincipal}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <Badge variant="outline">{ex.padrao}</Badge>
                      <span className="text-muted-foreground">RPE {ex.rpeAlvo}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div className="bg-muted/50 rounded p-2">
                      <div className="text-xs text-muted-foreground">Séries</div>
                      <div className="font-bold">{ex.series}</div>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <div className="text-xs text-muted-foreground">Reps</div>
                      <div className="font-bold">{ex.reps}</div>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <div className="text-xs text-muted-foreground">Carga</div>
                      <div className="font-bold">{ex.carga}</div>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <div className="text-xs text-muted-foreground">Descanso</div>
                      <div className="font-bold">{ex.descansoSeg}s</div>
                    </div>
                  </div>

                  {ex.notas && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 text-xs">
                      💡 {ex.notas}
                    </div>
                  )}

                  {exercicio && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {exercicio.cues && exercicio.cues.length > 0 && (
                        <div>
                          <span className="text-emerald-400">Cues:</span>{' '}
                          {exercicio.cues.join(' · ')}
                        </div>
                      )}
                      {exercicio.alerta50mais && (
                        <div className="text-amber-400">
                          ⚠️ {exercicio.alerta50mais}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <Button asChild className="w-full" size="lg">
            <Link to="/app/preparacao/nova" state={{ sessao: sessao, semana, templateId }}>
              <Flame className="h-4 w-4 mr-2" />
              Registrar Esta Sessão
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
