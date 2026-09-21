/**
 * errorLogger.ts — Log estruturado de erros no IndexedDB
 *
 * Captura erros do Error Boundary e qualquer try/catch
 * Armazena no IndexedDB para revisão pelo usuário
 * Ring buffer de 100 erros (rotaciona)
 *
 * USO:
 *   import { logError } from '@/lib/errorLogger';
 *
 *   try {
 *     await something();
 *   } catch (e) {
 *     logError(e, { context: 'TreinoForm' });
 *   }
 */
import { setInStore, getFromStore, getAllKeys, deleteFromStore } from './idbSchema';

export interface LoggedError {
  id: string;
  /** Mensagem do erro */
  message: string;
  /** Stack trace (se disponível) */
  stack?: string;
  /** Tipo/contexto do erro (ex: 'React.ErrorBoundary', 'TreinoForm.save') */
  source: string;
  /** Metadata adicional */
  metadata?: Record<string, any>;
  /** Quando ocorreu (ISO string) */
  timestamp: string;
  /** URL atual quando ocorreu */
  url: string;
  /** User agent (para debug) */
  userAgent: string;
  /** Quantas vezes este erro aconteceu (incrementado se duplicado) */
  count?: number;
}

const STORE = 'errors';
const KEY_PREFIX = 'error:';
const MAX_ERRORS = 100;

/**
 * Loga um erro no IndexedDB
 *
 * @returns ID do erro logado
 */
export async function logError(
  error: Error | string,
  options: {
    source?: string;
    metadata?: Record<string, any>;
  } = {},
): Promise<string> {
  const id = generateId();
  const err = typeof error === 'string' ? new Error(error) : error;

  const entry: LoggedError = {
    id,
    message: err.message || 'Erro desconhecido',
    stack: err.stack,
    source: options.source || 'unknown',
    metadata: options.metadata,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };

  try {
    await setInStore(STORE, KEY_PREFIX + id, entry);

    // Limpar ring buffer (manter últimos 100)
    await trimErrors();

    // Log em dev
    if (import.meta.env.DEV) {
      console.error('[errorLogger]', entry);
    }
  } catch (e) {
    // Falha ao logar — pelo menos console.error
    console.error('[errorLogger] failed to log:', e, entry);
  }

  return id;
}

/**
 * Lista todos os erros armazenados
 */
export async function listErrors(): Promise<LoggedError[]> {
  try {
    const keys = await getAllKeys(STORE);
    const errors: LoggedError[] = [];

    for (const key of keys) {
      if (key.startsWith(KEY_PREFIX)) {
        const err = await getFromStore<LoggedError>(STORE, key);
        if (err) errors.push(err);
      }
    }

    // Ordenar por timestamp desc
    return errors.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch {
    return [];
  }
}

/**
 * Remove um erro específico
 */
export async function clearError(id: string): Promise<boolean> {
  try {
    return await deleteFromStore(STORE, KEY_PREFIX + id);
  } catch {
    return false;
  }
}

/**
 * Remove todos os erros
 */
export async function clearAllErrors(): Promise<boolean> {
  try {
    const keys = await getAllKeys(STORE);
    let ok = true;
    for (const key of keys) {
      if (key.startsWith(KEY_PREFIX)) {
        ok = (await deleteFromStore(STORE, key)) && ok;
      }
    }
    return ok;
  } catch {
    return false;
  }
}

/**
 * Mantém apenas os últimos MAX_ERRORS erros
 */
async function trimErrors(): Promise<void> {
  const errors = await listErrors();
  if (errors.length <= MAX_ERRORS) return;

  // Remove os mais antigos
  const toRemove = errors.slice(MAX_ERRORS);
  for (const err of toRemove) {
    await deleteFromStore(STORE, KEY_PREFIX + err.id);
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
