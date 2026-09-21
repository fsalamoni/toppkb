/**
 * GlobalSearch — busca global no Topbar.
 *
 * Permite buscar rapidamente em:
 * - Treinos
 * - Partidas
 * - Dores
 * - Lesões
 * - Medidas
 * - Pesos
 * - Sono
 * - Torneios
 * - Metas
 * - Estudos
 *
 * Atalhos de teclado:
 * - Cmd/Ctrl + K para abrir
 * - Esc para fechar
 * - ↑/↓ para navegar nos resultados
 * - Enter para abrir o item selecionado
 *
 * Implementação:
 * - Single field de input no Topbar que abre Dialog full-screen no mobile
 * - Busca client-side (Firestore já carregado via TanStack Query cache)
 * - Resultados agrupados por categoria com ícones
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SearchItem {
  type: 'treino' | 'partida' | 'dor' | 'lesao' | 'medida' | 'peso' | 'sono' | 'torneio' | 'meta' | 'estudo' | 'pagina';
  titulo: string;
  subtitulo?: string;
  to: string;
  icon?: string;
  data?: number; // timestamp para sort
}

const PAGES: SearchItem[] = [
  { type: 'pagina', titulo: 'Dashboard', to: '/app/dashboard', icon: '🏓' },
  { type: 'pagina', titulo: 'Treinos', to: '/app/treinos', icon: '💪' },
  { type: 'pagina', titulo: 'Partidas', to: '/app/partidas', icon: '🏆' },
  { type: 'pagina', titulo: 'Preparação Física', to: '/app/preparacao', icon: '🏋️' },
  { type: 'pagina', titulo: 'Nutrição', to: '/app/nutricao', icon: '🥗' },
  { type: 'pagina', titulo: 'Sono', to: '/app/sono', icon: '😴' },
  { type: 'pagina', titulo: 'Peso', to: '/app/peso', icon: '⚖️' },
  { type: 'pagina', titulo: 'Medidas', to: '/app/medidas', icon: '📏' },
  { type: 'pagina', titulo: 'Dores', to: '/app/dores', icon: '⚠️' },
  { type: 'pagina', titulo: 'Lesões', to: '/app/lesoes', icon: '🩹' },
  { type: 'pagina', titulo: 'Torneios', to: '/app/torneios', icon: '🏆' },
  { type: 'pagina', titulo: 'Metas', to: '/app/metas', icon: '🎯' },
  { type: 'pagina', titulo: 'Estudos', to: '/app/estudos', icon: '📚' },
  { type: 'pagina', titulo: 'Hidratação', to: '/app/hidratacao', icon: '💧' },
  { type: 'pagina', titulo: 'Suplementos', to: '/app/suplementos', icon: '💊' },
  { type: 'pagina', titulo: 'Treinamento', to: '/app/treinamento', icon: '🏋️' },
  { type: 'pagina', titulo: 'Configurações', to: '/app/configuracoes', icon: '⚙️' },
  { type: 'pagina', titulo: 'Notificações', to: '/app/notificacoes', icon: '🔔' },
  { type: 'pagina', titulo: 'Chat com Coach', to: '/app/chat', icon: '🤖' },
];

const ICON_BY_TYPE: Record<string, string> = {
  treino: '💪',
  partida: '🏓',
  dor: '⚠️',
  lesao: '🩹',
  medida: '📏',
  peso: '⚖️',
  sono: '😴',
  torneio: '🏆',
  meta: '🎯',
  estudo: '📚',
  pagina: '📄',
  hidratacao: '💧',
  suplementos: '💊',
};

interface GlobalSearchProps {
  /** Dados que o usuário tem no cache do TanStack Query para buscar */
  collections?: {
    treinos?: any[];
    partidas?: any[];
    dores?: any[];
    lesoes?: any[];
    medidas?: any[];
    pesos?: any[];
    sonos?: any[];
    torneios?: any[];
    metas?: any[];
  };
}

export function GlobalSearch(_props: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Cmd/Ctrl + K para abrir
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Lê cache do TanStack Query
  const items = useMemo(() => {
    const all: SearchItem[] = [...PAGES];

    const tryRead = (key: string, map: (d: any) => SearchItem | null) => {
      const data: any = qc.getQueryData(key);
      if (Array.isArray(data)) {
        for (const d of data) {
          const item = map(d);
          if (item) all.push(item);
        }
      }
    };

    tryRead(['treinos'], (t) => ({
      type: 'treino',
      titulo: t.tipo || 'Treino',
      subtitulo: t.observacoes || `${t.duracaoMin || 0}min`,
      to: `/app/treinos/${t.id}`,
      icon: ICON_BY_TYPE.treino,
      data: t.data?.toDate?.()?.getTime() || Date.now(),
    }));
    tryRead(['partidas'], (p) => ({
      type: 'partida',
      titulo: `vs ${p.adversario || '—'}`,
      subtitulo: p.resultado || '—',
      to: `/app/partidas/${p.id}`,
      icon: ICON_BY_TYPE.partida,
      data: p.data?.toDate?.()?.getTime() || Date.now(),
    }));
    tryRead(['dores'], (d) => ({
      type: 'dor',
      titulo: d.regiao || 'Dor',
      subtitulo: `Intensidade ${d.intensidade}/10`,
      to: `/app/dores`,
      icon: ICON_BY_TYPE.dor,
      data: d.data?.toDate?.()?.getTime() || Date.now(),
    }));
    tryRead(['torneios'], (t) => ({
      type: 'torneio',
      titulo: t.nome || 'Torneio',
      subtitulo: t.local || '',
      to: `/app/torneios`,
      icon: ICON_BY_TYPE.torneio,
    }));

    return all;
  }, [qc]);

  // Filtra por query (case insensitive, qualquer substring)
  const results = useMemo(() => {
    if (!query.trim()) {
      // Sem query: mostra apenas páginas
      return items.filter((i) => i.type === 'pagina').slice(0, 18);
    }
    const q = query.toLowerCase();
    return items
      .filter((i) =>
        i.titulo.toLowerCase().includes(q) ||
        (i.subtitulo?.toLowerCase().includes(q) ?? false),
      )
      .sort((a, b) => (b.data || 0) - (a.data || 0)) // mais recentes primeiro
      .slice(0, 30);
  }, [items, query]);

  // Reset selectedIdx quando results mudam
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // Navegação por teclado
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(results.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter' && results[selectedIdx]) {
        e.preventDefault();
        navigate(results[selectedIdx].to);
        setOpen(false);
        setQuery('');
      }
    },
    [results, selectedIdx, navigate],
  );

  return (
    <>
      {/* Botão que abre o dialog */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/30 hover:bg-muted text-sm text-muted-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Buscar...</span>
        <kbd className="hidden lg:inline text-[10px] bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 max-h-[80vh]">
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar treinos, partidas, dores, páginas..."
              className="flex-1 bg-transparent border-none outline-none py-3 text-sm placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded">esc</kbd>
          </div>

          <div className="overflow-y-auto max-h-[60vh] py-2">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhum resultado para "{query}"
              </div>
            ) : (
              <ul className="space-y-0.5">
                {results.map((r, i) => (
                  <li key={`${r.type}-${r.to}-${i}`}>
                    <Link
                      to={r.to}
                      onClick={() => {
                        setOpen(false);
                        setQuery('');
                      }}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors',
                        i === selectedIdx && 'bg-accent',
                      )}
                      onMouseEnter={() => setSelectedIdx(i)}
                    >
                      <span className="text-lg" aria-hidden>
                        {r.icon || ICON_BY_TYPE[r.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{r.titulo}</div>
                        {r.subtitulo && (
                          <div className="text-xs text-muted-foreground truncate">{r.subtitulo}</div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span><kbd className="bg-muted px-1 rounded">↑↓</kbd> navegar</span>
              <span><kbd className="bg-muted px-1 rounded">↵</kbd> abrir</span>
              <span><kbd className="bg-muted px-1 rounded">esc</kbd> fechar</span>
            </div>
            <span>
              {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
