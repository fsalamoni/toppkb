import { Component, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface State {
  error: Error | null;
}

interface Props {
  children: ReactNode;
}

/**
 * ErrorBoundary global — captura erros de render do React
 * e exibe uma mensagem visível ao usuário.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-2xl mx-auto py-8">
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">Algo deu errado</div>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    {this.state.error.message}
                  </p>
                  <pre className="text-[10px] text-muted-foreground mt-2 max-h-32 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => this.setState({ error: null })}
                    >
                      Tentar novamente
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.location.reload()}
                    >
                      Recarregar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
