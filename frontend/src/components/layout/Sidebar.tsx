import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Apple, Heart, MessageCircle,
  Settings, LogOut, Scale, BedDouble, AlertCircle,
  Target, User as UserIcon, CircleDot, Ruler, Pill, Droplets,
  Activity, Sparkles, BookOpen,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null as string | null },
    ],
  },
  {
    label: '🏓 Pickleball',
    items: [
      { to: '/app/treinos', label: 'Treinos', icon: CircleDot, badge: null as string | null },
      { to: '/app/partidas', label: 'Partidas', icon: Trophy, badge: null as string | null },
      { to: '/app/estudos', label: 'Estudos', icon: BookOpen, badge: null as string | null },
    ],
  },
  {
    label: '💪 Preparação Física',
    items: [
      { to: '/app/preparacao', label: 'Preparação', icon: Activity, badge: null as string | null },
    ],
  },
  {
    label: '🥗 Nutrição',
    items: [
      { to: '/app/nutricao', label: 'Alimentação', icon: Apple, badge: null as string | null },
      { to: '/app/hidratacao', label: 'Hidratação', icon: Droplets, badge: null as string | null },
      { to: '/app/suplementos', label: 'Suplementos', icon: Pill, badge: null as string | null },
    ],
  },
  {
    label: '🩹 Saúde & Antropometria',
    items: [
      { to: '/app/peso', label: 'Peso', icon: Scale, badge: null as string | null },
      { to: '/app/medidas', label: 'Medidas', icon: Ruler, badge: null as string | null },
      { to: '/app/sono', label: 'Sono', icon: BedDouble, badge: null as string | null },
      { to: '/app/dores', label: 'Dores', icon: AlertCircle, badge: 'doresAtivas' as string | null },
      { to: '/app/lesoes', label: 'Lesões', icon: Heart, badge: null as string | null },
    ],
  },
  {
    label: '🏆 Competição',
    items: [
      { to: '/app/torneios', label: 'Torneios', icon: Trophy, badge: null as string | null },
    ],
  },
  {
    label: '📊 Métricas',
    items: [
      { to: '/app/metas', label: 'Metas', icon: Target, badge: null as string | null },
    ],
  },
  {
    label: '🤖 IA',
    items: [
      { to: '/app/chat', label: 'Chat com a equipe', icon: MessageCircle, badge: null as string | null },
    ],
  },
];

function useSidebarBadges(uid?: string) {
  // Dores ativas (intensidade >= 5)
  const { data: doresAtivas = 0 } = useQuery({
    queryKey: ['badge-dores-ativas', uid],
    queryFn: async () => {
      if (!uid) return 0;
      const snap = await getDocs(query(
        collection(db, 'toppkb_users', uid, 'dores'),
        where('ativa', '==', true),
        limit(20),
      ));
      return snap.docs.filter((d) => (d.data() as any).intensidade >= 5).length;
    },
    enabled: !!uid,
    staleTime: 60_000,
  });
  return { doresAtivas };
}

export function Sidebar() {
  const { user, isAdmin, signOut } = useAuth();
  const { sidebarOpen } = useUIStore();
  const navigate = useNavigate();
  const badges = useSidebarBadges(user?.uid);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  function getBadge(key: string | null): string | null {
    if (!key) return null;
    if (key === 'doresAtivas' && badges.doresAtivas > 0) return String(badges.doresAtivas);
    return null;
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card transition-all duration-200 flex-shrink-0',
        sidebarOpen ? 'w-64' : 'w-16',
      )}
    >
      <div className="flex items-center gap-2 p-4 border-b border-border h-14 flex-shrink-0">
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
            {group.items.map((item) => {
              const badge = getBadge(item.badge);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors relative',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive && 'bg-primary/10 text-primary font-medium',
                    )
                  }
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {sidebarOpen && <span className="flex-1">{item.label}</span>}
                  {sidebarOpen && badge && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-semibold tabular-nums">
                      {badge}
                    </span>
                  )}
                  {!sidebarOpen && badge && (
                    <span className="absolute top-0.5 right-0.5 text-xs px-1 rounded-full bg-red-500 text-white font-semibold">
                      {badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
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
              <Sparkles className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span>Painel admin</span>}
            </NavLink>
          </div>
        )}
      </nav>

      <div className="border-t border-border p-2 flex-shrink-0">
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
          <Settings className="h-4 w-4 flex-shrink-0" />
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
          <UserIcon className="h-4 w-4 flex-shrink-0" />
          {sidebarOpen && <span>Perfil</span>}
        </NavLink>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {sidebarOpen && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
