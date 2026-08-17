import { AgenteId } from '../services/ai/router';
import { PROMPT_TREINADOR } from './treinador';
import { PROMPT_PREPARADOR } from './preparador';
import { PROMPT_NUTRICIONISTA } from './nutricionista';
import { PROMPT_ESTRATEGISTA } from './estrategista';
import { PROMPT_GENERAL } from './general';

const PROMPTS: Record<AgenteId, string> = {
  treinador: PROMPT_TREINADOR,
  preparador: PROMPT_PREPARADOR,
  nutricionista: PROMPT_NUTRICIONISTA,
  estrategista: PROMPT_ESTRATEGISTA,
  general: PROMPT_GENERAL,
};

export function carregarSystemPrompt(agente: AgenteId): string {
  return PROMPTS[agente] || PROMPT_GENERAL;
}

export { PROMPTS };

export {
  PROMPT_TREINADOR,
  PROMPT_PREPARADOR,
  PROMPT_NUTRICIONISTA,
  PROMPT_ESTRATEGISTA,
  PROMPT_GENERAL,
};
