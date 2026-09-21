/**
 * useConfirm — hook para confirmação nativa com UI consistente.
 *
 * Substitui window.confirm() (que tem UX ruim, sem acessibilidade e sem
 * customização) por um modal ConfirmDialog bonito e acessível.
 *
 * USO:
 *   const { confirm, ConfirmDialogRoot } = useConfirm();
 *
 *   async function handleDelete() {
 *     const ok = await confirm({
 *       titulo: 'Remover treino?',
 *       descricao: 'Esta ação não pode ser desfeita.',
 *       variant: 'destructive',
 *     });
 *     if (ok) await del.mutate(id);
 *   }
 *
 *   return (
 *     <>
 *       <Button onClick={handleDelete}>Remover</Button>
 *       <ConfirmDialogRoot />
 *     </>
 *   );
 */
import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface ConfirmOptions {
  titulo: string;
  descricao: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  ConfirmDialogRoot: () => ReactNode;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<
    (ConfirmOptions & { open: boolean; resolve?: (v: boolean) => void }) | null
  >(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, open: true, resolve });
    });
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setState((prev) => {
      if (prev?.resolve && !open) prev.resolve(false);
      return prev ? { ...prev, open } : null;
    });
    if (!open) {
      // Pequeno delay para a animação de saída rodar antes de desmontar
      setTimeout(() => setState(null), 200);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (state?.resolve) state.resolve(true);
    setState(null);
  }, [state]);

  const value = useMemo<ConfirmContextValue>(
    () => ({
      confirm,
      ConfirmDialogRoot: () =>
        state ? (
          <ConfirmDialog
            open={state.open}
            onOpenChange={handleOpenChange}
            titulo={state.titulo}
            descricao={state.descricao}
            confirmText={state.confirmText}
            cancelText={state.cancelText}
            variant={state.variant}
            onConfirm={handleConfirm}
          />
        ) : null,
    }),
    [confirm, state, handleOpenChange, handleConfirm],
  );

  return <ConfirmContext.Provider value={value}>{children}</ConfirmContext.Provider>;
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm deve ser usado dentro de ConfirmProvider');
  }
  return ctx;
}
