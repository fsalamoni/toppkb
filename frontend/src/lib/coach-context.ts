/**
 * Coach Context — Enriquece prompts do coach com cues musculares leigos.
 * 
 * Quando o usuário pergunta sobre um exercício, este helper monta um bloco
 * de contexto com mapa muscular + sensações para incluir no system prompt.
 */

import { 
  KETTLEBELL_EXERCICIOS, 
  type ExercicioKettlebell,
  getDicaMuscularCurta,
  getErroMuscularCurto,
  getTopMusculaturas,
} from '@/data/seed/exercicios-kettlebell';
import type { AgenteId } from './llm-api';

export interface CoachContextInput {
  /** Mensagem original do usuário */
  message: string;
  /** Agente ativo */
  agente: AgenteId;
  /** Plano de treino ativo (opcional) */
  plano?: Array<{
    dia: string;
    exercicios: Array<{ id: string; nome: string; series: number; reps: string; carga?: string }>;
  }>;
  /** IDs de exercícios mencionados pelo usuário (opcional) */
  mentionedExercises?: string[];
}

export interface CoachContextOutput {
  /** Bloco de contexto enriquecido (a ser incluído no system prompt) */
  contextBlock: string;
  /** Quantos exercícios foram enriquecidos */
  enrichedCount: number;
}

/**
 * Detecta menções de exercícios KB na mensagem do usuário.
 * Estratégia: busca IDs exatos OU nomes aproximados.
 */
function detectMentionedExercises(message: string): string[] {
  const found = new Set<string>();
  const msgLower = message.toLowerCase();
  
  for (const ex of KETTLEBELL_EXERCICIOS) {
    // Match exato do nome
    if (msgLower.includes(ex.nome.toLowerCase())) {
      found.add(ex.id);
      continue;
    }
    // Match ID (sem o prefixo kb-)
    if (msgLower.includes(ex.id.replace('kb-', '').replace(/-/g, ' '))) {
      found.add(ex.id);
      continue;
    }
  }
  
  return Array.from(found);
}

function formatExerciseContext(ex: ExercicioKettlebell): string {
  const lines: string[] = [];
  lines.push(`### ${ex.nome} (${ex.id})`);
  lines.push(`- Padrão: ${ex.padraoKb} · Nível: ${ex.nivel} · Foco: ${ex.focoPrincipal}`);
  
  if (ex.mapaMuscularLeigo && ex.mapaMuscularLeigo.length > 0) {
    lines.push('- ONDE SENTIR (linguagem leiga):');
    ex.mapaMuscularLeigo.forEach((m) => lines.push(`  • ${m}`));
  }
  
  if (ex.sensacaoPrincipal) {
    lines.push(`- SENSAÇÃO PRINCIPAL: ${ex.sensacaoPrincipal}`);
  }
  
  if (ex.erroMuscular) {
    lines.push(`- ERRO MUSCULAR: ${ex.erroMuscular}`);
  }
  
  if (ex.analogiaInicial) {
    lines.push(`- PENSE ASSIM: ${ex.analogiaInicial}`);
  }
  
  if (ex.cargaInicial50mais) {
    lines.push(`- CARGA INICIAL (50+): ${ex.cargaInicial50mais}`);
  }
  
  if (ex.steps && ex.steps.length > 0) {
    lines.push('- PASSO A PASSO:');
    ex.steps.forEach((step) => {
      lines.push(`  ${step.numero}. ${step.titulo}: ${step.descricao.slice(0, 100)}...`);
      if (step.sensacoes && step.sensacoes.length > 0) {
        lines.push(`     💪 Onde/como sentir: ${step.sensacoes.slice(0, 2).join('; ')}`);
      }
      if (step.alertasMusculares && step.alertasMusculares.length > 0) {
        lines.push(`     ⚠️ Atenção: ${step.alertasMusculares.slice(0, 2).join('; ')}`);
      }
    });
  }
  
  return lines.join('\n');
}

/**
 * Monta o contexto enriquecido com cues musculares para o coach IA.
 */
export function buildCoachContext(input: CoachContextInput): CoachContextOutput {
  const mentionedIds = input.mentionedExercises || detectMentionedExercises(input.message);
  
  if (mentionedIds.length === 0) {
    return { contextBlock: '', enrichedCount: 0 };
  }
  
  const exercises = mentionedIds
    .map((id) => KETTLEBELL_EXERCICIOS.find((e) => e.id === id))
    .filter((e): e is ExercicioKettlebell => Boolean(e));
  
  if (exercises.length === 0) {
    return { contextBlock: '', enrichedCount: 0 };
  }
  
  const bloco = `

═══════════════════════════════════════════════════════
🎯 CONTEXTO MUSCULAR (use estas informações para responder)
═══════════════════════════════════════════════════════

${exercises.map(formatExerciseContext).join('\n\n')}

═══════════════════════════════════════════════════════
IMPORTANTE — Linguagem leiga:
- Use SEMPRE a nomenclatura do mapa muscular (bumbum, parte de trás da coxa, barriga, etc)
- NÃO use jargão técnico (glúteo máximo, isquiotibial, etc) a menos que o usuário pergunte explicitamente
- Indique ONDE o usuário deve SENTIR o trabalho muscular em CADA exercício
- Use as SENSAÇÕES PRINCIPAIS para descrever como o exercício deve "parecer" ao usuário
- ALERTE sobre os ERROS MUSCULARES comuns (quando o usuário compensa errado)
- Use ANALOGIAS para ensinar (como "cadeira atrás", "esmagar uma noz")
- Considere a CARGA INICIAL para 50+ (leve no início)
═══════════════════════════════════════════════════════
`;
  
  return {
    contextBlock: bloco,
    enrichedCount: exercises.length,
  };
}

/**
 * Versão resumida para uso rápido (só 1 exercício).
 */
export function getQuickContext(exId: string): string {
  const dica = getDicaMuscularCurta(exId);
  const erro = getErroMuscularCurto(exId);
  const top = getTopMusculaturas(exId, 2);
  
  if (!dica && !erro && top.length === 0) return '';
  
  const lines: string[] = [];
  if (top.length > 0) lines.push(`Onde sentir: ${top.join(', ')}.`);
  if (dica) lines.push(`Sensação: ${dica}`);
  if (erro) lines.push(`Erro comum: ${erro}`);
  
  return lines.join(' ');
}
