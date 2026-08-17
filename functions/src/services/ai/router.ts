/**
 * Router de agente — detecta qual persona deve responder
 * baseado em palavras-chave da mensagem.
 */

export type AgenteId = 'treinador' | 'preparador' | 'nutricionista' | 'estrategista' | 'general';

const KEYWORDS: Record<Exclude<AgenteId, 'general'>, string[]> = {
  treinador: [
    'dink', 'third shot', 'volley', 'saque', 'devolução', 'devolucao',
    'drill', 'rally', 'pickleball', 'técnica', 'tecnica', 'tática', 'tatica',
    'jogo', 'ponto', 'dupla', 'duplas', 'posicionamento', 'finta',
    'lob', 'smash', 'overhead', 'cozinha', 'kitchen', 'baseline',
    'ready position', 'split step', 'paddle', 'raquete', 'bola',
    'cross-court', 'paralelo', 'ataque', 'defesa', 'rede',
  ],
  preparador: [
    'joelho', 'ombro', 'lesão', 'lesao', 'dor', 'fisio', 'fisioterapia',
    'mobilidade', 'alongamento', 'aquecimento', 'preparação física',
    'preparacao fisica', 'força', 'forca', 'musculação', 'musculacao',
    'agachamento', 'carga', 'série', 'serie', 'rpe', 'recuperação', 'recuperacao',
    'cardio', 'aeróbico', 'aerobico', 'anaeróbico', 'anaerobico',
    'prevenção', 'prevencao', 'costas', 'tornozelo', 'punho',
    'cotovelo', 'quadril', 'fisioterapeuta', 'ortopedista', 'lesão',
    'biomecânica', 'biomecanica', 'postura', 'core', 'glúteo', 'gluteo',
  ],
  nutricionista: [
    'comida', 'alimentação', 'alimentacao', 'refeição', 'refeicao',
    'dieta', 'kcal', 'caloria', 'calorias', 'proteína', 'proteina',
    'carboidrato', 'gordura', 'macros', 'cardápio', 'cardapio',
    'suplemento', 'creatina', 'vitamina', 'whey', 'caseína', 'caseina',
    'anti-inflamatório', 'anti-inflamatorio', 'hidratação', 'hidratacao',
    'água', 'agua', 'jejum', 'deficit', 'déficit', 'arroz', 'feijão', 'feijao',
    'frango', 'ovo', 'peixe', 'tapioca', 'aveia', 'banana',
    'batata doce', 'granola', 'castanha', 'castanhas', 'nozes',
    'omega 3', 'vit d', 'vitamina d', 'colágeno', 'colageno',
  ],
  estrategista: [
    'torneio', 'ranking', 'dupr', 'inscrição', 'inscricao',
    'calendário', 'calendario', 'cbp', 'federação', 'federacao',
    'categoria 50', 'categoria 45', 'meta', 'objetivo',
    'mês', 'mes', 'ano 2032', 'progresso', 'avaliação', 'avaliacao',
    'métrica', 'metrica', 'kpi', 'plano de jogo', 'match',
    'confronto', 'ranking nacional', 'top 10', 'top 20',
    '50+', '45+', 'campeonato', 'open', 'regional', 'estadual', 'nacional',
  ],
};

const BODY_PARTS = /\b(joelho|ombro|costas|pulso|tornozelo|quadril|cotovelo|joelho d|joelho e|ombro d|ombro e)\b/i;

export function detectarAgente(mensagem: string): AgenteId {
  const m = mensagem.toLowerCase();
  const scores: Record<Exclude<AgenteId, 'general'>, number> = {
    treinador: 0,
    preparador: 0,
    nutricionista: 0,
    estrategista: 0,
  };

  for (const [agente, kws] of Object.entries(KEYWORDS)) {
    for (const kw of kws) {
      if (m.includes(kw)) {
        scores[agente as keyof typeof scores] += 1;
      }
    }
  }

  // Bônus: partes do corpo → preparador
  if (BODY_PARTS.test(m)) {
    scores.preparador += 2;
  }

  // Bônus: alimento específico → nutricionista
  if (/\b(arroz|feijão|frango|ovo|peixe|carne|banana|maçã)\b/i.test(m)) {
    scores.nutricionista += 1;
  }

  // Bônus: verbo técnico de pickleball → treinador
  if (/\b(dinkar|cortar|colocar|devolver|atacar|defender)\b/i.test(m)) {
    scores.treinador += 2;
  }

  // Pega o top
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return top[1] > 0 ? (top[0] as AgenteId) : 'general';
}

/**
 * Gera um título curto para a conversa baseado na primeira mensagem.
 */
export function gerarTituloConversa(mensagem: string): string {
  const limpo = mensagem
    .replace(/[^\w\sÀ-ÿ]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join(' ');
  if (limpo.length > 50) return limpo.slice(0, 47) + '...';
  return limpo || 'Nova conversa';
}
