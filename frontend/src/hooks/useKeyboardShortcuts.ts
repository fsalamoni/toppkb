/**
 * useKeyboardShortcuts — registra atalhos de teclado globais
 *
 * Atalhos comuns:
 * - Cmd/Ctrl + S → Salvar (Form)
 * - Cmd/Ctrl + K → Busca global (já existe no GlobalSearch)
 * - Escape → Fechar modal
 * - ? → Ajuda de atalhos
 * - g + d → Dashboard
 * - g + t → Treinos
 *
 * USO:
 *   useKeyboardShortcuts({
 *     onSave: () => form.submit(),
 *     onHelp: () => setShowHelp(true),
 *   });
 */
import { useEffect } from 'react';

export interface KeyboardShortcuts {
  /** Cmd/Ctrl + S */
  onSave?: () => void;
  /** Cmd/Ctrl + K (busca global) */
  onSearch?: () => void;
  /** Cmd/Ctrl + N (novo) */
  onNew?: () => void;
  /** Escape (fechar) */
  onEscape?: () => void;
  /** ? (mostrar ajuda) */
  onHelp?: () => void;
  /** g + d (go to dashboard) */
  onGoDashboard?: () => void;
  /** g + t (go to treinos) */
  onGoTreinos?: () => void;
  /** g + p (go to partidas) */
  onGoPartidas?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    let lastG = 0;

    const handler = (e: KeyboardEvent) => {
      // Ignora quando typing em input/textarea (exceto Esc)
      const target = e.target as HTMLElement;
      const isTyping =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) ||
        target?.isContentEditable;

      // Cmd/Ctrl + S → save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        shortcuts.onSave?.();
        return;
      }

      // Cmd/Ctrl + K → search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        shortcuts.onSearch?.();
        return;
      }

      // Cmd/Ctrl + N → new
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        shortcuts.onNew?.();
        return;
      }

      // Escape → close (funciona mesmo em inputs)
      if (e.key === 'Escape') {
        shortcuts.onEscape?.();
        return;
      }

      // Skip outros atalhos se estiver digitando
      if (isTyping) return;

      // ? → help (Shift+/)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        shortcuts.onHelp?.();
        return;
      }

      // g + X → go to X
      if (e.key === 'g' && Date.now() - lastG > 1000) {
        lastG = Date.now();
        return;
      }
      if (Date.now() - lastG < 1000) {
        if (e.key === 'd') {
          e.preventDefault();
          shortcuts.onGoDashboard?.();
        } else if (e.key === 't') {
          e.preventDefault();
          shortcuts.onGoTreinos?.();
        } else if (e.key === 'p') {
          e.preventDefault();
          shortcuts.onGoPartidas?.();
        }
        lastG = 0;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
