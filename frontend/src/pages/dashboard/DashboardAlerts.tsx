/**
 * DashboardAlerts — alertas contextuais no topo do Dashboard.
 *
 * Mostra 3 tipos de alerta baseado nos dados:
 * 1. Dor ativa detectada → direciona para registro de dor
 * 2. Streak de vitórias ≥ 3 → celebra a consistência
 * 3. Hidratação baixa (< 50% da meta) → lembra de beber água
 *
 * Cada alerta tem severidade visual (cor) e ação CTA.
 */
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Flame, Droplet } from 'lucide-react';

interface DashboardAlertsProps {
  dorAtiva?: {
    regiao?: string;
    intensidade: number;
    data?: any;
  } | null;
  streak: number;
  streakType?: 'V' | 'D' | null;
  hidratacaoAtual: number;
  hidratacaoMeta: number;
}

export function DashboardAlerts({
  dorAtiva,
  streak,
  streakType,
  hidratacaoAtual,
  hidratacaoMeta,
}: DashboardAlertsProps) {
  return (
    <>
      {dorAtiva && <PainAlert dorAtiva={dorAtiva} />}
      {streak >= 3 && streakType === 'V' && <StreakAlert streak={streak} />}
      {hidratacaoMeta > 0 && hidratacaoAtual < hidratacaoMeta * 0.5 && (
        <HidratacaoAlert atual={hidratacaoAtual} meta={hidratacaoMeta} />
      )}
    </>
  );
}

function PainAlert({ dorAtiva }: { dorAtiva: any }) {
  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardContent className="pt-4 pb-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-sm">Atenção: dor ativa detectada</div>
          <p className="text-xs text-muted-foreground">
            {dorAtiva.regiao || 'Região'} · intensidade {dorAtiva.intensidade}/10
          </p>
          <p className="text-xs mt-1">
            Recomendação: avalie se precisa descanso ou adaptação no próximo treino.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/app/dores">Ver</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function StreakAlert({ streak }: { streak: number }) {
  return (
    <Card className="border-emerald-500/50 bg-emerald-500/5">
      <CardContent className="pt-4 pb-4 flex items-center gap-3">
        <Flame className="h-6 w-6 text-emerald-500" />
        <div>
          <div className="font-semibold">{streak} vitórias seguidas! 🔥</div>
          <p className="text-xs text-muted-foreground">Continue assim. Mente e corpo em flow.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function HidratacaoAlert({ atual, meta }: { atual: number; meta: number }) {
  return (
    <Card className="border-cyan-500/50 bg-cyan-500/5">
      <CardContent className="pt-4 pb-4 flex items-center gap-3">
        <Droplet className="h-5 w-5 text-cyan-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="font-semibold text-sm">
            Hidratação baixa hoje: {atual}ml / {meta}ml
          </div>
          <p className="text-xs text-muted-foreground">
            Para 50+, beber água antes de sentir sede é crucial.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/app/hidratacao/nova">Registrar</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
