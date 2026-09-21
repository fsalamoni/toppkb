/**
 * ErrorBoundary — captura erros React e loga no IndexedDB
 *
 * Substitui o ErrorBoundary básico anterior.
 * - Loga erro no errorLogger
 * - Mostra UI de fallback amigável
 * - Permite ao usuário reportar/recarregar
 *
 * USO:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logError } from '@/lib/errorLogger';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Nome do componente/página para identificar no log */
  componentName?: string;
  /** Custom fallback (opcional) */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = await logError(error, {
      source: this.props.componentName || 'React.ErrorBoundary',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });
    this.setState({ errorId });
  }

  reset = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallbackUI
          error={this.state.error}
          errorId={this.state.errorId}
          onReset={this.reset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackUIProps {
  error: Error | null;
  errorId: string | null;
  onReset: () => void;
}

function ErrorFallbackUI({ error, errorId, onReset }: ErrorFallbackUIProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <EmptyState
          illustration="error"
          title="Algo deu errado"
          description={
            error?.message ||
            'Ocorreu um erro inesperado. Você pode tentar recarregar a página ou voltar para o início.'
          }
          action={
            <div className="flex gap-2 mt-4 justify-center">
              <Button onClick={onReset} variant="default" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Tentar novamente
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/app/dashboard">
                  <Home className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              </Button>
            </div>
          }
        />
        {errorId && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            ID do erro: <code className="px-1 py-0.5 bg-muted rounded">{errorId}</code>
          </p>
        )}
      </div>
    </div>
  );
}
