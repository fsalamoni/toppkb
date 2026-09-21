/**
 * ShortcutsHelp — modal que lista todos os atalhos de teclado
 *
 * Acionado por "?" ou Cmd/Ctrl + /
 * Lista atalhos agrupados por categoria
 */
import { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const SHORTCUTS = [
  {
    category: 'Geral',
    items: [
      { keys: ['Cmd/Ctrl', 'S'], description: 'Salvar formulário' },
      { keys: ['Cmd/Ctrl', 'K'], description: 'Buscar' },
      { keys: ['Cmd/Ctrl', 'N'], description: 'Novo' },
      { keys: ['Esc'], description: 'Fechar modal/dropdown' },
      { keys: ['?'], description: 'Mostrar esta ajuda' },
    ],
  },
  {
    category: 'Navegação (g + ...)',
    items: [
      { keys: ['g', 'd'], description: 'Dashboard' },
      { keys: ['g', 't'], description: 'Treinos' },
      { keys: ['g', 'p'], description: 'Partidas' },
    ],
  },
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useKeyboardShortcuts({
    onHelp: () => setOpen((v) => !v),
    onEscape: () => setOpen(false),
  });

  // Listener para abrir com ? mesmo quando hook não disponível
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) ||
        target?.isContentEditable;
      if (isTyping) return;
      if (e.key === '?') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Atalhos de teclado</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {SHORTCUTS.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {group.category}
              </h3>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li
                    key={item.description}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-foreground">{item.description}</span>
                    <span className="flex gap-1">
                      {item.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded border border-border"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button size="sm" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
