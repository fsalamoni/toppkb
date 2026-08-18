import { Link } from 'react-router-dom';
import { Menu, MessageCircle, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const { userDoc, claims } = useAuth();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="text-sm text-muted-foreground">
          Olá, <span className="text-foreground font-medium">{userDoc?.displayName || 'Atleta'}</span> 🏓
          {claims?.admin && (
            <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">
              {claims.admin === 'master' ? 'Master' : 'Admin'}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/app/chat"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden md:inline">Chat</span>
        </Link>
        <Link
          to="/app/perfil"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          <UserIcon className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
