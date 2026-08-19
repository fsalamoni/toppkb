/**
 * Banco de Alimentos Brasileiros — base de referência nutricional.
 * Dados por 100g. Fonte: TBCA (Tabela Brasileira de Composição de Alimentos).
 *
 * Este é um dataset de AUTOCOMPLETE e referência — o banco oficial fica
 * em /toppkb_seed/alimentos (Firestore) e pode ser atualizado pelo admin.
 */

export interface Alimento {
  id: string;
  nome: string;
  categoria: 'proteina' | 'carboidrato' | 'gordura' | 'vegetal' | 'fruta' | 'laticinio' | 'suplemento' | 'bebida' | 'outro';
  // Por 100g
  kcal: number;
  proteina: number;        // g
  carboidrato: number;      // g
  gordura: number;         // g
  fibra: number;            // g
  sodio: number;            // mg
  porcaoComum: string;     // descrição
  porcaoGramas: number;     // gramas
  busca: string[];          // termos de busca
}

export const ALIMENTOS: Alimento[] = [
  // ============ PROTEÍNAS ============
  { id: 'frango-peito', nome: 'Peito de frango (grelhado)', categoria: 'proteina', kcal: 165, proteina: 31, carboidrato: 0, gordura: 3.6, fibra: 0, sodio: 74, porcaoComum: '1 filé médio', porcaoGramas: 120, busca: ['frango', 'peito', 'grelhado', 'proteina'] },
  { id: 'frango-coxa', nome: 'Coxa de frango (sem pele)', categoria: 'proteina', kcal: 209, proteina: 26, carboidrato: 0, gordura: 11, fibra: 0, sodio: 88, porcaoComum: '1 coxa', porcaoGramas: 100, busca: ['frango', 'coxa'] },
  { id: 'carne-magra', nome: 'Carne magra (patinho)', categoria: 'proteina', kcal: 219, proteina: 26, carboidrato: 0, gordura: 12, fibra: 0, sodio: 65, porcaoComum: '1 bife médio', porcaoGramas: 150, busca: ['carne', 'bovina', 'patinho', 'magra', 'proteina'] },
  { id: 'carne-alcatra', nome: 'Alcatra', categoria: 'proteina', kcal: 163, proteina: 22, carboidrato: 0, gordura: 8, fibra: 0, sodio: 60, porcaoComum: '1 bife', porcaoGramas: 150, busca: ['carne', 'alcatra', 'bovina'] },
  { id: 'tilapia', nome: 'Tilápia (grelhada)', categoria: 'proteina', kcal: 128, proteina: 26, carboidrato: 0, gordura: 2.7, fibra: 0, sodio: 52, porcaoComum: '1 filé', porcaoGramas: 120, busca: ['tilapia', 'peixe'] },
  { id: 'salmao', nome: 'Salmão (grelhado)', categoria: 'proteina', kcal: 208, proteina: 22, carboidrato: 0, gordura: 13, fibra: 0, sodio: 59, porcaoComum: '1 filé', porcaoGramas: 120, busca: ['salmao', 'peixe', 'omega3'] },
  { id: 'atum-lata', nome: 'Atum em lata (água)', categoria: 'proteina', kcal: 116, proteina: 26, carboidrato: 0, gordura: 1, fibra: 0, sodio: 247, porcaoComum: '1 lata', porcaoGramas: 120, busca: ['atum', 'lata', 'peixe'] },
  { id: 'sardinha', nome: 'Sardinha (lata)', categoria: 'proteina', kcal: 208, proteina: 24, carboidrato: 0, gordura: 11, fibra: 0, sodio: 505, porcaoComum: '1 lata', porcaoGramas: 100, busca: ['sardinha', 'peixe'] },
  { id: 'ovo-inteiro', nome: 'Ovo inteiro (cozido)', categoria: 'proteina', kcal: 155, proteina: 13, carboidrato: 1.1, gordura: 11, fibra: 0, sodio: 124, porcaoComum: '1 unidade', porcaoGramas: 50, busca: ['ovo', 'cozido'] },
  { id: 'clara-ovo', nome: 'Clara de ovo', categoria: 'proteina', kcal: 52, proteina: 11, carboidrato: 0.7, gordura: 0.2, fibra: 0, sodio: 166, porcaoComum: '1 clara', porcaoGramas: 33, busca: ['ovo', 'clara', 'albumina'] },
  { id: 'tofu', nome: 'Tofu', categoria: 'proteina', kcal: 76, proteina: 8, carboidrato: 1.9, gordura: 4.8, fibra: 0.3, sodio: 7, porcaoComum: '1 fatia', porcaoGramas: 100, busca: ['tofu', 'vegetariano'] },

  // ============ CARBOIDRATOS ============
  { id: 'arroz-branco', nome: 'Arroz branco cozido', categoria: 'carboidrato', kcal: 130, proteina: 2.7, carboidrato: 28, gordura: 0.3, fibra: 0.4, sodio: 1, porcaoComum: '1 escumadeira', porcaoGramas: 100, busca: ['arroz', 'branco', 'cozido'] },
  { id: 'arroz-integral', nome: 'Arroz integral cozido', categoria: 'carboidrato', kcal: 124, proteina: 2.6, carboidrato: 26, gordura: 0.9, fibra: 1.8, sodio: 1, porcaoComum: '1 escumadeira', porcaoGramas: 100, busca: ['arroz', 'integral'] },
  { id: 'batata-doce', nome: 'Batata-doce cozida', categoria: 'carboidrato', kcal: 86, proteina: 1.6, carboidrato: 20, gordura: 0.1, fibra: 3, sodio: 55, porcaoComum: '1 unidade média', porcaoGramas: 150, busca: ['batata', 'doce', 'carboidrato'] },
  { id: 'batata-inglesa', nome: 'Batata inglesa cozida', categoria: 'carboidrato', kcal: 86, proteina: 1.7, carboidrato: 19, gordura: 0.1, fibra: 1.5, sodio: 4, porcaoComum: '1 unidade', porcaoGramas: 150, busca: ['batata', 'inglesa'] },
  { id: 'macarrao', nome: 'Macarrão cozido', categoria: 'carboidrato', kcal: 158, proteina: 5.8, carboidrato: 31, gordura: 0.9, fibra: 1.8, sodio: 1, porcaoComum: '1 prato', porcaoGramas: 150, busca: ['macarrao', 'massa', 'espaguete'] },
  { id: 'pao-integral', nome: 'Pão integral', categoria: 'carboidrato', kcal: 247, proteina: 13, carboidrato: 41, gordura: 3.4, fibra: 7, sodio: 472, porcaoComum: '1 fatia', porcaoGramas: 28, busca: ['pao', 'integral', 'fibra'] },
  { id: 'pao-frances', nome: 'Pão francês', categoria: 'carboidrato', kcal: 270, proteina: 8, carboidrato: 56, gordura: 0.5, fibra: 2.3, sodio: 660, porcaoComum: '1 unidade', porcaoGramas: 50, busca: ['pao', 'frances'] },
  { id: 'aveia', nome: 'Aveia em flocos', categoria: 'carboidrato', kcal: 379, proteina: 13, carboidrato: 67, gordura: 6.5, fibra: 10, sodio: 6, porcaoComum: '2 colheres de sopa', porcaoGramas: 30, busca: ['aveia', 'fibra', 'cafe'] },
  { id: 'granola', nome: 'Granola', categoria: 'carboidrato', kcal: 471, proteina: 10, carboidrato: 65, gordura: 20, fibra: 8, sodio: 19, porcaoComum: '1/2 xícara', porcaoGramas: 50, busca: ['granola', 'fibra'] },
  { id: 'quinoa', nome: 'Quinoa cozida', categoria: 'carboidrato', kcal: 120, proteina: 4.4, carboidrato: 21, gordura: 1.9, fibra: 2.8, sodio: 7, porcaoComum: '1 xícara', porcaoGramas: 185, busca: ['quinoa', 'proteina', 'carboidrato'] },
  { id: 'mandioca', nome: 'Mandioca cozida', categoria: 'carboidrato', kcal: 125, proteina: 0.6, carboidrato: 30, gordura: 0.3, fibra: 1.2, sodio: 2, porcaoComum: '1 pedaço médio', porcaoGramas: 100, busca: ['mandioca', 'aipim', 'carboidrato'] },
  { id: 'inhame', nome: 'Inhame cozido', categoria: 'carboidrato', kcal: 116, proteina: 1.5, carboidrato: 27, gordura: 0.2, fibra: 3.9, sodio: 9, porcaoComum: '1 unidade', porcaoGramas: 150, busca: ['inhame'] },
  { id: 'cuscuz', nome: 'Cuscuz de milho', categoria: 'carboidrato', kcal: 112, proteina: 3.8, carboidrato: 23, gordura: 0.2, fibra: 1.4, sodio: 5, porcaoComum: '1 fatia', porcaoGramas: 100, busca: ['cuscuz', 'milho', 'nordeste'] },
  { id: 'tapioca', nome: 'Tapioca (goma)', categoria: 'carboidrato', kcal: 240, proteina: 0.5, carboidrato: 60, gordura: 0.1, fibra: 1, sodio: 1, porcaoComum: '1 unidade', porcaoGramas: 50, busca: ['tapioca', 'goma'] },

  // ============ GORDURAS ============
  { id: 'azeite-oliva', nome: 'Azeite de oliva extra-virgem', categoria: 'gordura', kcal: 884, proteina: 0, carboidrato: 0, gordura: 100, fibra: 0, sodio: 2, porcaoComum: '1 colher de sopa', porcaoGramas: 13, busca: ['azeite', 'oliva', 'gordura boa'] },
  { id: 'abacate', nome: 'Abacate', categoria: 'gordura', kcal: 160, proteina: 2, carboidrato: 9, gordura: 15, fibra: 7, sodio: 7, porcaoComum: '1/2 unidade', porcaoGramas: 100, busca: ['abacate', 'gordura', 'fibra'] },
  { id: 'castanha-para', nome: 'Castanha-do-Pará', categoria: 'gordura', kcal: 656, proteina: 14, carboidrato: 12, gordura: 66, fibra: 8, sodio: 2, porcaoComum: '3 unidades', porcaoGramas: 15, busca: ['castanha', 'para', 'selenio'] },
  { id: 'castanha-caju', nome: 'Castanha de caju', categoria: 'gordura', kcal: 553, proteina: 18, carboidrato: 30, gordura: 44, fibra: 3.3, sodio: 12, porcaoComum: '10 unidades', porcaoGramas: 30, busca: ['castanha', 'caju'] },
  { id: 'pasta-amendoim', nome: 'Pasta de amendoim integral', categoria: 'gordura', kcal: 588, proteina: 25, carboidrato: 20, gordura: 50, fibra: 6, sodio: 17, porcaoComum: '1 colher de sopa', porcaoGramas: 16, busca: ['pasta', 'amendoim'] },
  { id: 'amendoim', nome: 'Amendoim torrado', categoria: 'gordura', kcal: 567, proteina: 26, carboidrato: 16, gordura: 49, fibra: 8, sodio: 18, porcaoComum: '1 punhado', porcaoGramas: 30, busca: ['amendoim'] },
  { id: 'linhaca', nome: 'Linhaça (semente)', categoria: 'gordura', kcal: 534, proteina: 18, carboidrato: 29, gordura: 42, fibra: 27, sodio: 30, porcaoComum: '1 colher de sopa', porcaoGramas: 10, busca: ['linhaca', 'omega3', 'fibra'] },
  { id: 'chia', nome: 'Chia (semente)', categoria: 'gordura', kcal: 486, proteina: 17, carboidrato: 42, gordura: 31, fibra: 34, sodio: 16, porcaoComum: '1 colher de sopa', porcaoGramas: 12, busca: ['chia', 'omega3', 'fibra'] },

  // ============ VEGETAIS ============
  { id: 'brocolis', nome: 'Brócolis cozido', categoria: 'vegetal', kcal: 35, proteina: 2.4, carboidrato: 7, gordura: 0.4, fibra: 3.3, sodio: 41, porcaoComum: '1 xícara', porcaoGramas: 100, busca: ['brocolis', 'vegetal', 'verde'] },
  { id: 'couve', nome: 'Couve refogada', categoria: 'vegetal', kcal: 35, proteina: 2.9, carboidrato: 4.3, gordura: 0.6, fibra: 4.1, sodio: 25, porcaoComum: '1 prato', porcaoGramas: 100, busca: ['couve', 'vegetal', 'refogada'] },
  { id: 'alface', nome: 'Alface', categoria: 'vegetal', kcal: 15, proteina: 1.4, carboidrato: 2.9, gordura: 0.2, fibra: 1.3, sodio: 28, porcaoComum: '1 prato', porcaoGramas: 100, busca: ['alface', 'salada'] },
  { id: 'tomate', nome: 'Tomate', categoria: 'vegetal', kcal: 18, proteina: 1.1, carboidrato: 3.9, gordura: 0.2, fibra: 1.2, sodio: 5, porcaoComum: '1 unidade', porcaoGramas: 100, busca: ['tomate', 'salada'] },
  { id: 'cenoura', nome: 'Cenoura', categoria: 'vegetal', kcal: 41, proteina: 0.9, carboidrato: 9.6, gordura: 0.2, fibra: 2.8, sodio: 69, porcaoComum: '1 unidade', porcaoGramas: 100, busca: ['cenoura', 'vegetal'] },
  { id: 'abobrinha', nome: 'Abobrinha', categoria: 'vegetal', kcal: 17, proteina: 1.2, carboidrato: 3.1, gordura: 0.2, fibra: 1, sodio: 8, porcaoComum: '1 unidade', porcaoGramas: 150, busca: ['abobrinha', 'vegetal'] },
  { id: 'couve-flor', nome: 'Couve-flor', categoria: 'vegetal', kcal: 25, proteina: 1.9, carboidrato: 5, gordura: 0.3, fibra: 2, sodio: 30, porcaoComum: '1 xícara', porcaoGramas: 100, busca: ['couve', 'flor', 'vegetal'] },
  { id: 'abobora', nome: 'Abóbora cabotiá cozida', categoria: 'vegetal', kcal: 26, proteina: 1.4, carboidrato: 6.5, gordura: 0.1, fibra: 1.8, sodio: 4, porcaoComum: '1 xícara', porcaoGramas: 100, busca: ['abobora', 'vegetal', 'caroteno'] },

  // ============ FRUTAS ============
  { id: 'banana', nome: 'Banana', categoria: 'fruta', kcal: 89, proteina: 1.1, carboidrato: 23, gordura: 0.3, fibra: 2.6, sodio: 1, porcaoComum: '1 unidade média', porcaoGramas: 100, busca: ['banana', 'potassio', 'pre treino'] },
  { id: 'maca', nome: 'Maçã', categoria: 'fruta', kcal: 52, proteina: 0.3, carboidrato: 14, gordura: 0.2, fibra: 2.4, sodio: 1, porcaoComum: '1 unidade', porcaoGramas: 130, busca: ['maca', 'fibra'] },
  { id: 'laranja', nome: 'Laranja', categoria: 'fruta', kcal: 47, proteina: 0.9, carboidrato: 12, gordura: 0.1, fibra: 2.4, sodio: 0, porcaoComum: '1 unidade', porcaoGramas: 130, busca: ['laranja', 'vitamina c'] },
  { id: 'mamao', nome: 'Mamão papaia', categoria: 'fruta', kcal: 43, proteina: 0.5, carboidrato: 11, gordura: 0.3, fibra: 1.7, sodio: 8, porcaoComum: '1 fatia', porcaoGramas: 100, busca: ['mamao', 'papaia'] },
  { id: 'morango', nome: 'Morango', categoria: 'fruta', kcal: 32, proteina: 0.7, carboidrato: 7.7, gordura: 0.3, fibra: 2, sodio: 1, porcaoComum: '1 xícara', porcaoGramas: 100, busca: ['morango'] },
  { id: 'abacate-fruta', nome: 'Abacate (classificado como fruta)', categoria: 'fruta', kcal: 160, proteina: 2, carboidrato: 9, gordura: 15, fibra: 7, sodio: 7, porcaoComum: '1/2 unidade', porcaoGramas: 100, busca: ['abacate'] },
  { id: 'melancia', nome: 'Melancia', categoria: 'fruta', kcal: 30, proteina: 0.6, carboidrato: 8, gordura: 0.2, fibra: 0.4, sodio: 1, porcaoComum: '1 fatia', porcaoGramas: 200, busca: ['melancia', 'hidratacao'] },

  // ============ LATICÍNIOS ============
  { id: 'leite-integral', nome: 'Leite integral', categoria: 'laticinio', kcal: 61, proteina: 3.2, carboidrato: 4.8, gordura: 3.3, fibra: 0, sodio: 43, porcaoComum: '1 copo', porcaoGramas: 200, busca: ['leite', 'integral'] },
  { id: 'leite-desnatado', nome: 'Leite desnatado', categoria: 'laticinio', kcal: 35, proteina: 3.4, carboidrato: 5, gordura: 0.2, fibra: 0, sodio: 42, porcaoComum: '1 copo', porcaoGramas: 200, busca: ['leite', 'desnatado'] },
  { id: 'iogurte-natural', nome: 'Iogurte natural', categoria: 'laticinio', kcal: 51, proteina: 4.1, carboidrato: 4.7, gordura: 1.5, fibra: 0, sodio: 47, porcaoComum: '1 pote', porcaoGramas: 170, busca: ['iogurte', 'natural', 'proteina'] },
  { id: 'iogurte-grego', nome: 'Iogurte grego natural', categoria: 'laticinio', kcal: 59, proteina: 10, carboidrato: 3.6, gordura: 0.4, fibra: 0, sodio: 36, porcaoComum: '1 pote', porcaoGramas: 170, busca: ['iogurte', 'grego', 'proteina'] },
  { id: 'queijo-minas', nome: 'Queijo minas frescal', categoria: 'laticinio', kcal: 240, proteina: 17, carboidrato: 3.2, gordura: 18, fibra: 0, sodio: 561, porcaoComum: '1 fatia', porcaoGramas: 30, busca: ['queijo', 'minas', 'frescal'] },
  { id: 'queijo-cottage', nome: 'Queijo cottage', categoria: 'laticinio', kcal: 98, proteina: 11, carboidrato: 3.4, gordura: 4.3, fibra: 0, sodio: 364, porcaoComum: '2 colheres', porcaoGramas: 50, busca: ['queijo', 'cottage', 'proteina'] },
  { id: 'whey-protein', nome: 'Whey Protein (1 scoop médio)', categoria: 'suplemento', kcal: 120, proteina: 24, carboidrato: 3, gordura: 1.5, fibra: 0, sodio: 100, porcaoComum: '1 scoop', porcaoGramas: 30, busca: ['whey', 'proteina', 'suplemento'] },
  { id: 'creatina', nome: 'Creatina monohidratada', categoria: 'suplemento', kcal: 0, proteina: 0, carboidrato: 0, gordura: 0, fibra: 0, sodio: 0, porcaoComum: '1 colher de chá (5g)', porcaoGramas: 5, busca: ['creatina', 'suplemento', 'forca'] },

  // ============ BEBIDAS ============
  { id: 'agua', nome: 'Água', categoria: 'bebida', kcal: 0, proteina: 0, carboidrato: 0, gordura: 0, fibra: 0, sodio: 0, porcaoComum: '1 copo', porcaoGramas: 200, busca: ['agua', 'hidratacao'] },
  { id: 'cafe', nome: 'Café (sem açúcar)', categoria: 'bebida', kcal: 2, proteina: 0.3, carboidrato: 0, gordura: 0, fibra: 0, sodio: 2, porcaoComum: '1 xícara', porcaoGramas: 50, busca: ['cafe', 'cafeina'] },
  { id: 'cha-verde', nome: 'Chá verde', categoria: 'bebida', kcal: 1, proteina: 0, carboidrato: 0, gordura: 0, fibra: 0, sodio: 1, porcaoComum: '1 xícara', porcaoGramas: 240, busca: ['cha', 'verde', 'antioxidante'] },
  { id: 'suco-laranja', nome: 'Suco de laranja natural', categoria: 'bebida', kcal: 45, proteina: 0.7, carboidrato: 10, gordura: 0.2, fibra: 0.2, sodio: 1, porcaoComum: '1 copo', porcaoGramas: 200, busca: ['suco', 'laranja', 'vitamina c'] },
  { id: 'leite-coco', nome: 'Leite de coco', categoria: 'bebida', kcal: 230, proteina: 2.3, carboidrato: 5.5, gordura: 24, fibra: 2.2, sodio: 15, porcaoComum: '1/2 xícara', porcaoGramas: 100, busca: ['leite', 'coco', 'gordura'] },
  { id: 'isotonico', nome: 'Bebida isotônica', categoria: 'bebida', kcal: 25, proteina: 0, carboidrato: 6, gordura: 0, fibra: 0, sodio: 41, porcaoComum: '1 garrafa', porcaoGramas: 200, busca: ['isotonico', 'eletrolito', 'hidratacao'] },
];

export const CATEGORIAS_ALIMENTO: Record<string, { nome: string; icone: string; cor: string }> = {
  proteina: { nome: 'Proteína', icone: '🥩', cor: 'red' },
  carboidrato: { nome: 'Carboidrato', icone: '🌾', cor: 'amber' },
  gordura: { nome: 'Gordura boa', icone: '🥑', cor: 'yellow' },
  vegetal: { nome: 'Vegetal', icone: '🥦', cor: 'green' },
  fruta: { nome: 'Fruta', icone: '🍎', cor: 'rose' },
  laticinio: { nome: 'Laticínio', icone: '🥛', cor: 'blue' },
  suplemento: { nome: 'Suplemento', icone: '💊', cor: 'purple' },
  bebida: { nome: 'Bebida', icone: '🥤', cor: 'cyan' },
  outro: { nome: 'Outro', icone: '🍽️', cor: 'slate' },
};
