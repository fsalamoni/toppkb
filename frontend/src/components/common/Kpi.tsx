/**
 * Kpi — KPI card simples para dashboard
 */
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'blue' | 'green' | 'emerald' | 'amber' | 'purple' | 'red';
  sublabel?: string;
}

const ACCENTS = {
  blue: 'text-blue-500 bg-blue-500/10',
  green: 'text-green-500 bg-green-500/10',
  emerald: 'text-emerald-500 bg-emerald-500/10',
  amber: 'text-amber-500 bg-amber-500/10',
  purple: 'text-purple-500 bg-purple-500/10',
  red: 'text-red-500 bg-red-500/10',
};

export function Kpi({ label, value, icon: Icon, accent = 'blue', sublabel }: KpiProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className={cn('p-2 rounded-md', ACCENTS[accent])}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-xl font-bold tabular-nums">{value}</div>
        {sublabel && <div className="text-xs text-muted-foreground">{sublabel}</div>}
      </div>
    </div>
  );
}
