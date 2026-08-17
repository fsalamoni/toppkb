import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="text-7xl mb-4">🏓</div>
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-muted-foreground mb-6">Página não encontrada</p>
      <Button asChild>
        <Link to="/">
          <Home className="h-4 w-4" /> Voltar ao dashboard
        </Link>
      </Button>
    </div>
  );
}
