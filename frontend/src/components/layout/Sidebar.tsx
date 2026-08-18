import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Apple, Heart, MessageCircle,
  CalendarDays, Settings, LogOut, Menu, Scale, BedDouble, AlertCircle,
  Target, User as UserIcon, CircleDot,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: '🏓 Pickleball',
    items: [
      { to: '/app/treinos', label: 'Treinos', icon: CircleDot },
      { to: '/app/partidas', label: 'Partidas', icon: Trophy },
      { to: '/app/estudos', label: 'Estudos', icon: CalendarDays },
    ],
  },
  {
    label: '💪 Preparação',
    items: [
      { to: '/app/fisio', label: 'Fisio', icon: Heart },
    ],
  },
  {
    label: '🥗 Nutrição',
    items: [
      { to: '/app/nutricao', label: 'Alimentação', icon: Apple },
    ],
  },
  {
    label: '🩹 Saúde',
    items: [
      { to: '/app/peso', label: 'Peso', icon: Scale },
      { to: '/app/sono', label: 'Sono', icon: BedDouble },
      { to: '/app/dores', label: 'Dores', icon: AlertCircle },
    ],
  },
  {
    label: '🏆 Competição',
    items: [
      { to: '/app/torneios', label: 'Torneios', icon: Trophy },
    ],
  },
  {
    label: '📊 Métricas',
    items: [
      { to: '/app/metas', label: 'Metas', icon: Target },
    ],
  },
  {
    label: '🤖 IA',
    items: [
      { to: '/app/chat', label: 'Chat com a equipe', icon: MessageCircle },
    ],
  },
];

export function Sidebar() {
  const { user, signOut, isAdmin } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/app/');
  };

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card transition-all duration-200',
        sidebarOpen ? 'w-64' : 'w-16',
      )}
    >
      <div className="flex items-center gap-2 p-4 border-b border-border h-14">
        <div className="text-2xl">🏓</div>
        {sidebarOpen && (
          <div className="font-semibold text-sm">
            <div>Top Pickleball</div>
            <div className="text-xs text-muted-foreground">50+</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            {sidebarOpen && (
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                {group.label}
              </div>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-primary/10 text-primary font-medium',
                  )
                }
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}

        {isAdmin && (
          <div className="mb-4">
            {sidebarOpen && (
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                🛠 Admin
              </div>
            )}
            <NavLink
              to="/app/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-primary/10 text-primary font-medium',
                )
              }
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span>Painel admin</span>}
            </NavLink>
          </div>
        )}
      </nav>

      <div className="border-t border-border p-2">
        <NavLink
          to="/app/configuracoes"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
              'hover:bg-accent',
              isActive && 'bg-accent',
            )
          }
        >
          <Settings className="h-4 w-4" />
          {sidebarOpen && <span>Configurações</span>}
        </NavLink>
        <NavLink
          to="/app/perfil"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
              'hover:bg-accent',
              isActive && 'bg-accent',
            )
          }
        >
          <UserIcon className="h-4 w-4" />
          {sidebarOpen && <span>Perfil</span>}
        </NavLink>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
          {sidebarOpen && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
