import { Outlet, NavLink, Link } from 'react-router-dom';
import { ArrowLeft, Database, Brain, Users, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/app/admin', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/app/admin/corpus', label: 'Corpus', icon: Database },
  { to: '/app/admin/llm', label: 'LLM Global', icon: SettingsIcon },
  { to: '/app/admin/agents', label: 'Agentes', icon: Brain },
  { to: '/app/admin/users', label: 'Usuários', icon: Users },
  { to: '/app/admin/stats', label: 'Estatísticas', icon: BarChart3 },
];

export function AdminLayout() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">Gerencie LLM, corpus, agentes e usuários.</p>
        </div>
        <Link to="/app/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao app
        </Link>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )
              }
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
