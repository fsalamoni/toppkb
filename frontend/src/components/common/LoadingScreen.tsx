export function LoadingScreen({ mensagem }: { mensagem?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="text-6xl animate-bounce">🏓</div>
      {mensagem && <div className="text-sm text-muted-foreground">{mensagem}</div>}
    </div>
  );
}

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  return (
    <div className={`${sz} animate-spin rounded-full border-2 border-current border-t-transparent text-primary`} />
  );
}

export function EmptyState({ icone = '📭', titulo, descricao, acao }: { icone?: string; titulo: string; descricao?: string; acao?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-6xl mb-4">{icone}</div>
      <div className="text-lg font-medium">{titulo}</div>
      {descricao && <div className="text-sm text-muted-foreground mt-2 max-w-md">{descricao}</div>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}
