/**
 * Wrapper sobre o multi-provider LLM.
 * Mantido por compatibilidade — use generateWithProvider de llm-providers.ts.
 */

export {
  generateWithProvider,
  listModelsForProvider,
  maskKey,
  isMaskedKey,
  defaultBaseUrl,
  withTimeout,
  LLM_PROVIDERS,
} from '../llm-providers';

export type { LLMConfigLike, LLMProvider, LLMMessage, LLMGenerateInput, LLMGenerateOutput } from '../llm-providers';
