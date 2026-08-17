import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Pickleball,
  Trophy,
  Dumbbell,
  Apple,
  Heart,
  CalendarDays,
  TrendingUp,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: '🏓 Pickleball',
    items: [
      { to: '/treinos', label: 'Treinos', icon: Pickleball },
      { to: '/partidas', label: 'Partidas', icon: Trophy },
      { to: '/estudos', label: 'Estudos', icon: CalendarDays },
    ],
  },
  {
    label: '💪 Preparação Física',
    items: [
      { to: '/fisico/fisio', label: 'Fisio', icon: Heart },
      { to: '/fisico/forca', label: 'Força', icon: Dumbbell },
      { to: '/fisico/mobilidade', label: 'Mobilidade', icon: ActivityIcon },
      { to: '/fisico/cardio', label: 'Cardio', icon: ActivityIcon },
    ],
  },
  {
    label: '🥗 Alimentação',
    items: [
      { to: '/alimentacao/refeicoes', label: 'Refeições', icon: Apple },
      { to: '/alimentacao/agua', label: 'Água', icon: WaterIcon },
      { to: '/alimentacao/suplementos', label: 'Suplementos', icon: PillIcon },
    ],
  },
  {
    label: '🩹 Saúde',
    items: [
      { to: '/saude/peso', label: 'Peso', icon: ScaleIcon },
      { to: '/saude/medidas', label: 'Medidas', icon: RulerIcon },
      { to: '/saude/sono', label: 'Sono', icon: BedIcon },
      { to: '/saude/dores', label: 'Dores', icon: AlertIcon },
    ],
  },
  {
    label: '🏆 Competição',
    items: [{ to: '/torneios', label: 'Torneios', icon: Trophy }],
  },
  {
    label: '📊 Métricas',
    items: [
      { to: '/metricas', label: 'Visão geral', icon: TrendingUp },
      { to: '/metricas/metas', label: 'Metas', icon: TargetIcon },
    ],
  },
  {
    label: '🤖 IA',
    items: [{ to: '/chat', label: 'Chat com a equipe', icon: MessageCircle }],
  },
];

// Inline icon helpers (to keep file small)
function ActivityIcon(p: any) { return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>; }
function WaterIcon(p: any) { return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>; }
function PillIcon(p: any) { return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="9" width="18" height="6" rx="3" /><line x1="12" y1="9" x2="12" y2="15" /></svg>; }
function ScaleIcon(p: any) { return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 7h14M6 7l-2 12h4l-2-12M18 7l-2 12h4l-2-12M12 3v18" /></svg>; }
function RulerIcon(p: any) { return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12l10-10 10 10-10 10z M7 7l2 2 M10 4l2 2 M13 7l2 2" /></svg>; }
function BedIcon(p: any) { return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7 M3 14h18 M3 21v-3 M21 21v-3" /></svg>; }
function AlertIcon(p: any) { return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>; }
function TargetIcon(p: any) { return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>; }

export function AppShell() {
  const { userDoc, signOut } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card transition-all duration-200',
          sidebarOpen ? 'w-64' : 'w-0 -ml-64 md:ml-0 md:w-16',
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
                  end={item.to === '/'}
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
        </nav>

        <div className="border-t border-border p-2">
          <NavLink
            to="/configuracoes"
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
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="text-sm text-muted-foreground">
              Olá, <span className="text-foreground font-medium">{userDoc?.displayName || 'Atleta'}</span> 🏓
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground">
              💬 Chat
            </Link>
            <Link to="/configuracoes/perfil" className="text-sm text-muted-foreground hover:text-foreground">
              <UserIcon className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
