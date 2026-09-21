/**
 * ConfirmDialog — diálogo de confirmação acessível.
 *
 * Suporta dois modos:
 * 1. Direto (open, onOpenChange, onConfirm) — uso como componente
 * 2. Via hook useConfirm() — substitui window.confirm() com UI consistente
 *
 * Acessibilidade:
 * - Foco automático no botão de confirmação ao abrir
 * - ESC fecha o dialog (cancelando)
 * - Bloqueia scroll do body enquanto aberto
 */
import { useEffect, useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  descricao: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ConfirmDialog({
  open, onOpenChange, titulo, descricao, confirmText = 'Confirmar',
  cancelText = 'Cancelar', variant = 'default', onConfirm, loading,
}: ConfirmDialogProps) {
  const [working, setWorking] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Foco automático no botão de confirmação ao abrir
  useEffect(() => {
    if (open && confirmBtnRef.current) {
      const t = setTimeout(() => confirmBtnRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const handleConfirm = async () => {
    setWorking(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (e) {
      // Não fecha em caso de erro — usuário pode tentar de novo
      console.warn('[ConfirmDialog] onConfirm falhou:', e);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === 'destructive' ? (
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            ) : (
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
            )}
            <span>{titulo}</span>
          </DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={working || loading}>{cancelText}</Button>
          </DialogClose>
          <Button
            ref={confirmBtnRef}
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={working || loading}
          >
            {working || loading ? 'Aguarde...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
