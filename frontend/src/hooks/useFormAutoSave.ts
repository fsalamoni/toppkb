/**
 * useFormAutoSave — auto-salva dados de Form no localStorage
 *
 * PROBLEMA RESOLVIDO:
 * - User começa a preencher um Form longo (Treino com 20 campos)
 * - Acidentalmente fecha a aba ou browser crash
 * - Perde TUDO que digitou
 *
 * SOLUÇÃO:
 * - Salva automaticamente no localStorage a cada X segundos (debounce)
 * - Restaura automaticamente quando Form abre
 * - Botão "Limpar rascunho" para resetar
 * - Timestamp mostra quando foi salvo pela última vez
 */
import { useEffect, useState, useRef, useCallback } from 'react';

interface UseFormAutoSaveOptions<T> {
  /** Chave única para identificar o rascunho */
  key: string;
  /** Dados do Form (objeto) */
  data: T;
  /** Tempo de debounce em ms (default: 1000 = 1s) */
  delay?: number;
  /** Habilitar auto-save */
  enabled?: boolean;
}

interface UseFormAutoSaveReturn<T = any> {
  /** Timestamp do último save */
  savedAt: Date | null;
  /** Está salvando agora */
  saving: boolean;
  /** Limpar rascunho manualmente */
  clear: () => void;
  /** Recarregar rascunho manualmente */
  restore: () => T | null;
}

function writeDraft(storageKey: string, data: any): boolean {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ data, savedAt: new Date().toISOString() }),
    );
    return true;
  } catch {
    return false;
  }
}

export function useFormAutoSave<T = any>({
  key,
  data,
  delay = 1000,
  enabled = true,
}: UseFormAutoSaveOptions<T>): UseFormAutoSaveReturn {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<T>(data);
  dataRef.current = data;

  const storageKey = `toppkb-draft:${key}`;

  // Debounced save quando data muda
  useEffect(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setSaving(true);
      const ok = writeDraft(storageKey, dataRef.current);
      if (ok) setSavedAt(new Date());
      setSaving(false);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, delay, enabled, storageKey]);

  // beforeunload: salvar último valor (best-effort)
  useEffect(() => {
    if (!enabled) return;
    const handler = () => {
      writeDraft(storageKey, dataRef.current);
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled, storageKey]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setSavedAt(null);
    } catch (e) {
      console.warn('[useFormAutoSave] clear failed:', e);
    }
  }, [storageKey]);

  const restore = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      setSavedAt(new Date(parsed.savedAt));
      return parsed.data as T;
    } catch {
      return null;
    }
  }, [storageKey]);

  return {
    savedAt,
    saving,
    clear,
    restore,
  };
}

/**
 * Hook auxiliar para inicializar Form com dados restaurados
 */
export function useDraftRestore<T = any>(key: string): T | null {
  const [draft] = useState<T | null>(() => {
    try {
      const raw = localStorage.getItem(`toppkb-draft:${key}`);
      if (!raw) return null;
      return JSON.parse(raw).data as T;
    } catch {
      return null;
    }
  });
  return draft;
}
