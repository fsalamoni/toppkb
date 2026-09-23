/**
 * DashboardKPIs — KPIs (Key Performance Indicators) do Dashboard.
 *
 * Mostra os 7 principais indicadores de performance:
 * - Treinos (7d)
 * - Partidas (7d)
 * - Win Rate %
 * - Sono médio
 * - Peso atual (com meta)
 * - Próximo torneio (em dias)
 * - Streak atual (V/D)
 *
 * Sub-componentes:
 * - KPICard: card individual de KPI
 * - QuickAction: ação rápida de acesso
 */
import { Link } from 'react-router-dom';
import { memo as ReactMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Activity, Trophy, TrendingUp, Heart, Target, Calendar, Flame, Info,
} from 'lucide-react';

interface DashKPIsProps {
  treinos7d: number;
  partidas7d: number;
  winRate: number;
  vitoriasTotal: number;
  totalPartidas: number;
  sonoMedio: number | null;
  pesoAtual: number | null;
  pesoMeta?: number;
  proximoTorneio?: { nome: string; diasRestantes: number | null } | null;
  streak: number;
  streakType?: 'V' | 'D' | null;
}

export function DashboardKPIs(props: DashKPIsProps) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Treinos (7d)" value={props.treinos7d.toString()} icon={Activity} color="emerald" link="/app/treinos" tooltip="Quantidade de sessões de treino registradas nos últimos 7 dias" />
        <KPICard label="Partidas (7d)" value={props.partidas7d.toString()} icon={Trophy} color="amber" link="/app/partidas" tooltip="Quantidade de partidas de pickleball jogadas nos últimos 7 dias" />
        <KPICard
          label="Win Rate"
          value={`${props.winRate}%`}
          sub={`${props.vitoriasTotal}V de ${props.totalPartidas}`}
          icon={TrendingUp}
          color="primary"
          tooltip="Percentual de vitórias sobre o total de partidas registradas"
        />
        <KPICard
          label="Sono médio"
          value={props.sonoMedio ? `${props.sonoMedio.toFixed(1)}h` : '—'}
          icon={Heart}
          color="rose"
          link="/app/sono"
          tooltip="Média de horas dormidas por noite (meta: 7-9h para atletas 50+)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPICard
          label="Peso atual"
          value={props.pesoAtual ? `${props.pesoAtual.toFixed(1)} kg` : '—'}
          sub={props.pesoMeta ? `Meta: ${props.pesoMeta}kg` : 'Defina meta em Configurações'}
          icon={Target}
          color="cyan"
          link="/app/peso"
          tooltip="Último peso registrado. Acompanhar peso é crucial para performance no pickleball"
        />
        <KPICard
          label="Próximo torneio"
          value={props.proximoTorneio?.diasRestantes !== null ? `${props.proximoTorneio?.diasRestantes}d` : '—'}
          sub={props.proximoTorneio?.nome || 'Nenhum agendado'}
          icon={Calendar}
          color="purple"
          link="/app/torneios"
          tooltip="Próximo torneio agendado. Use este contador para planejar tapering e preparação"
        />
        <KPICard
          label="Streak atual"
          value={props.streak > 0 ? `${props.streak} ${props.streakType === 'V' ? 'V' : 'D'}` : '—'}
          sub={
            props.streak > 0
              ? props.streakType === 'V' ? 'Vitórias seguidas' : 'Derrotas seguidas'
              : 'Sem sequência'
          }
          icon={Flame}
          color={props.streakType === 'V' ? 'emerald' : props.streakType === 'D' ? 'red' : 'slate'}
          tooltip="Sequência atual de vitórias ou derrotas consecutivas"
        />
      </div>
    </>
  );
}

export const KPICard = ReactMemo(function KPICard({
  label, value, sub, icon: Icon, color, link, tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  color: 'emerald' | 'amber' | 'primary' | 'rose' | 'cyan' | 'purple' | 'red' | 'slate' | 'blue';
  link?: string;
  /** Tooltip didático explicando o KPI */
  tooltip?: string;
}) {
  const colorClasses: Record<string, { text: string; bg: string }> = {
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/10' },
    primary: { text: 'text-primary', bg: 'bg-primary/10' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-500/10' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500/10' },
    red: { text: 'text-red-400', bg: 'bg-red-500/10' },
    slate: { text: 'text-slate-400', bg: 'bg-slate-500/10' },
    blue: { text: 'text-blue-400', bg: 'bg-blue-500/10' },
  };

  const iconBg = colorClasses[color] || colorClasses.primary;

  const inner = (
    <Card className="hover:border-primary/50 transition relative group">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div className={`p-1.5 rounded-md ${iconBg.bg}`}>
            <Icon className={`h-3.5 w-3.5 ${iconBg.text}`} />
          </div>
          {tooltip && (
            <Info
              className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground cursor-help"
              aria-label={tooltip}
              tabIndex={0}
            />
          )}
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
        {tooltip && (
          <div
            role="tooltip"
            className="absolute left-0 right-0 top-full mt-1 z-50 px-2 py-1.5 rounded-md bg-popover text-popover-foreground text-[11px] leading-tight shadow-lg border border-border opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity"
          >
            {tooltip}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return link ? <Link to={link}>{inner}</Link> : inner;
});

export const QuickAction = ReactMemo(function QuickAction({
  href, icon: Icon, label, color,
}: {
  href: string;
  icon: any;
  label: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'hover:border-emerald-500/50 text-emerald-400',
    amber: 'hover:border-amber-500/50 text-amber-400',
    cyan: 'hover:border-cyan-500/50 text-cyan-400',
    rose: 'hover:border-rose-500/50 text-rose-400',
    orange: 'hover:border-orange-500/50 text-orange-400',
    blue: 'hover:border-blue-500/50 text-blue-400',
    purple: 'hover:border-purple-500/50 text-purple-400',
  };
  return (
    <Link
      to={href}
      className={`flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-all ${colorClasses[color] || ''}`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] text-center leading-tight">{label}</span>
    </Link>
  );
});
