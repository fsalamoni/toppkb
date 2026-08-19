/**
 * Banco de Exercícios — referência para sessões de preparação física.
 * Cada exercício tem grupos musculares, equipamento necessário, dica.
 */

export interface Exercicio {
  id: string;
  nome: string;
  grupo: 'peito' | 'costas' | 'ombro' | 'bracos' | 'pernas' | 'gluteos' | 'core' | 'cardio' | 'mobilidade' | 'aquecimento' | 'alongamento';
  padraoMovimento: 'empurrar' | 'puxar' | 'agachar' | 'hinge' | 'correr' | 'rotacao' | 'estatico';
  equipamento: 'barra' | 'halter' | 'maquina' | 'cabo' | 'peso-corporal' | 'elastico' | 'kettlebell' | 'bola' | 'nenhum';
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  focoPrincipal: string;       // peito (pectoral), etc
  musculosSecundarios: string[];
  descricao: string;
  dicas: string[];
  contraIndicacoes?: string[];
  // Atleta 50+: avisos específicos
  alerta50mais?: string;
}

export const EXERCICIOS: Exercicio[] = [
  // ============ PEITO ============
  {
    id: 'supino-reto-barra',
    nome: 'Supino reto (barra)',
    grupo: 'peito', padraoMovimento: 'empurrar', equipamento: 'barra',
    nivel: 'intermediario', focoPrincipal: 'Peitoral maior',
    musculosSecundarios: ['Tríceps', 'Deltoide anterior'],
    descricao: 'Deitado no banco, segure a barra com pegada levemente mais aberta que os ombros. Desça controladamente até o peito e empurre de volta.',
    dicas: ['Escápulas retraídas no banco', 'Pés firmes no chão', 'Barra alinhada com o peito', 'Respiração: inspire descendo, expire subindo'],
    contraIndicacoes: ['Dor crônica no ombro', 'Lesão no manguito rotador'],
    alerta50mais: 'Use barra guiada ou halteres para mais estabilidade. Não trave os cotovelos no topo.',
  },
  {
    id: 'supino-inclinado-halter',
    nome: 'Supino inclinado (halter)',
    grupo: 'peito', padraoMovimento: 'empurrar', equipamento: 'halter',
    nivel: 'intermediario', focoPrincipal: 'Peitoral superior',
    musculosSecundarios: ['Deltoide anterior', 'Tríceps'],
    descricao: 'Banco a 30-45°. Halteres ao lado do peito, empurre para cima juntando as mãos no topo.',
    dicas: ['Inclinação entre 30-45° (mais que isso, vira exercício de ombro)', 'Movimento controlado, sem trancos', 'Use amplitude confortável'],
    alerta50mais: 'Excelente variação para idosos — menor carga, maior controle. Mantenha cotovelos a 45° do tronco.',
  },
  {
    id: 'crucifixo-halteres',
    nome: 'Crucifixo com halteres',
    grupo: 'peito', padraoMovimento: 'empurrar', equipamento: 'halter',
    nivel: 'iniciante', focoPrincipal: 'Peitoral (alongamento)',
    musculosSecundarios: ['Deltoide anterior'],
    descricao: 'Deitado, braços abertos com leve flexão de cotovelo. Junte os halteres acima do peito.',
    dicas: ['Cotovelos com flexão fixa (~15°)', 'Desça até sentir alongamento (não dor)', 'Não use carga excessiva — foca em alongamento'],
  },
  {
    id: 'flexao',
    nome: 'Flexão de braço',
    grupo: 'peito', padraoMovimento: 'empurrar', equipamento: 'peso-corporal',
    nivel: 'iniciante', focoPrincipal: 'Peitoral, tríceps, core',
    musculosSecundarios: ['Deltoide anterior', 'Core'],
    descricao: 'Mãos alinhadas com ombros, corpo em prancha. Desça o peito até quase tocar o chão.',
    dicas: ['Core contraído o tempo todo', 'Cotovelos a 45° do tronco (não totalmente abertos)', 'Se difícil: apoie os joelhos', 'Progressão: declive → regulares → palmar → com peso'],
  },

  // ============ COSTAS ============
  {
    id: 'barra-fixa',
    nome: 'Barra fixa',
    grupo: 'costas', padraoMovimento: 'puxar', equipamento: 'peso-corporal',
    nivel: 'avancado', focoPrincipal: 'Grande dorsal',
    musculosSecundarios: ['Bíceps', 'Romboides', 'Trapézio'],
    descricao: 'Pendurado na barra, puxe o corpo até o queixo passar da barra.',
    dicas: ['Pegada pronada (palmas para frente), largura dos ombros', 'Puxe com as costas, não com os braços', 'Não balance o corpo'],
    alerta50mais: 'Se não conseguir fazer nenhuma, use máquina de puxada com carga leve. Posso começar com 3x5 assistido.',
  },
  {
    id: 'remada-curvada-barra',
    nome: 'Remada curvada (barra)',
    grupo: 'costas', padraoMovimento: 'puxar', equipamento: 'barra',
    nivel: 'intermediario', focoPrincipal: 'Costas (meio)',
    musculosSecundarios: ['Bíceps', 'Lombar', 'Glúteos'],
    descricao: 'Inclinado a 45°, puxe a barra em direção ao umbigo, contraindo as escápulas.',
    dicas: ['Costas retas (lordose natural)', 'Cabeça alinhada com coluna', 'Puxe até a barra tocar o abdômen inferior'],
    alerta50mais: 'Mantenha lombar protegida. Se sentir desconforto, prefira remada unilateral com halter.',
  },
  {
    id: 'puxada-frontal',
    nome: 'Puxada frontal (polia)',
    grupo: 'costas', padraoMovimento: 'puxar', equipamento: 'cabo',
    nivel: 'iniciante', focoPrincipal: 'Dorsal',
    musculosSecundarios: ['Bíceps', 'Romboides'],
    descricao: 'Sentado na máquina, puxe a barra em direção ao peito, contraindo as costas.',
    dicas: ['Puxe com as costas, não com os braços', 'Mantenha tronco estável, sem balançar', 'Não puxe atrás do pescoço (risco de lesão)'],
  },
  {
    id: 'remada-unilateral-halter',
    nome: 'Remada unilateral (halter)',
    grupo: 'costas', padraoMovimento: 'puxar', equipamento: 'halter',
    nivel: 'iniciante', focoPrincipal: 'Costas (assimetria)',
    musculosSecundarios: ['Bíceps', 'Core'],
    descricao: 'Apoiado em banco com uma mão e um joelho, puxe o halter em direção ao quadril.',
    dicas: ['Costas paralelas ao chão', 'Cotovelo próximo ao corpo', 'Ideal para corrigir assimetrias'],
    alerta50mais: 'Excelente para 50+: trabalha cada lado de forma independente, menos carga lombar.',
  },

  // ============ OMBRO ============
  {
    id: 'desenvolvimento-halter',
    nome: 'Desenvolvimento com halteres (sentado)',
    grupo: 'ombro', padraoMovimento: 'empurrar', equipamento: 'halter',
    nivel: 'iniciante', focoPrincipal: 'Deltoide',
    musculosSecundarios: ['Tríceps', 'Trapézio superior'],
    descricao: 'Sentado com apoio nas costas, empurre os halteres acima da cabeça.',
    dicas: ['Não bater os halteres no topo', 'Desça até a altura dos ombros', 'Cotovelos a 45° à frente do corpo'],
    alerta50mais: 'Não faça atrás da nuca — risco alto de lesão no manguito rotador. Sempre à frente.',
  },
  {
    id: 'elevacao-lateral',
    nome: 'Elevação lateral',
    grupo: 'ombro', padraoMovimento: 'empurrar', equipamento: 'halter',
    nivel: 'iniciante', focoPrincipal: 'Deltoide medial',
    musculosSecundarios: ['Trapézio superior'],
    descricao: 'Em pé, eleve os braços lateralmente até a altura dos ombros.',
    dicas: ['Cotovelos levemente flexionados (15°)', 'Polegares para cima (canivete)', 'Sem balanço — use carga leve'],
    alerta50mais: 'Indicado ombro saudável. Se houver dor, pare. Carga leve (até 8kg) é suficiente.',
  },
  {
    id: 'encolhimento',
    nome: 'Encolhimento (trapézio)',
    grupo: 'ombro', padraoMovimento: 'puxar', equipamento: 'halter',
    nivel: 'iniciante', focoPrincipal: 'Trapézio superior',
    musculosSecundarios: ['Levantador da escápula'],
    descricao: 'Em pé com halteres, eleve os ombros em direção às orelhas.',
    dicas: ['Sem rodar os ombros (só subir)', 'Segure 1-2 segundos no topo', 'Carga moderada (trapézio é forte)'],
  },

  // ============ BRAÇOS ============
  {
    id: 'rosca-direta-barra',
    nome: 'Rosca direta (barra)',
    grupo: 'bracos', padraoMovimento: 'puxar', equipamento: 'barra',
    nivel: 'iniciante', focoPrincipal: 'Bíceps',
    musculosSecundarios: ['Antebraço'],
    descricao: 'Em pé, cotovelos fixos ao lado do corpo, flexione o cotovelo levando a barra ao peito.',
    dicas: ['Cotovelos colados ao tronco', 'Sem balanço do corpo', 'Exercício básico mas efetivo'],
  },
  {
    id: 'rosca-martelo',
    nome: 'Rosca martelo',
    grupo: 'bracos', padraoMovimento: 'puxar', equipamento: 'halter',
    nivel: 'iniciante', focoPrincipal: 'Braquial + bíceps',
    musculosSecundarios: ['Antebraço'],
    descricao: 'Com halteres em pegada neutra (martelo), faça a rosca.',
    dicas: ['Ótima para antebraço', 'Pode alternar braços', 'Movimento controlado'],
    alerta50mais: 'Recomendo priorizar essa variação sobre rosca direta — mais confortável para cotovelos sensíveis.',
  },
  {
    id: 'triceps-testa',
    nome: 'Tríceps testa (francês)',
    grupo: 'bracos', padraoMovimento: 'empurrar', equipamento: 'barra',
    nivel: 'intermediario', focoPrincipal: 'Tríceps (cabeça longa)',
    musculosSecundarios: ['Deltoide'],
    descricao: 'Deitado, segure a barra com pegada fechada. Flexione apenas o cotovelo, levando a barra em direção à testa.',
    dicas: ['Cotovelos fixos, apontando para cima', 'Somente antebraço se move', 'Cuidado com amplitude excessiva (cotovelo)'],
  },
  {
    id: 'triceps-corda',
    nome: 'Tríceps na corda (polia)',
    grupo: 'bracos', padraoMovimento: 'empurrar', equipamento: 'cabo',
    nivel: 'iniciante', focoPrincipal: 'Tríceps',
    musculosSecundarios: ['Antebraço'],
    descricao: 'Na polia alta com corda, empurre para baixo estendendo os cotovelos. Afaste as pontas no final.',
    dicas: ['Cotovelos colados ao tronco', 'No final, afaste as pontas para contrair a cabeça lateral', 'Sem balançar o tronco'],
  },

  // ============ PERNAS ============
  {
    id: 'agachamento-livre',
    nome: 'Agachamento livre (barra)',
    grupo: 'pernas', padraoMovimento: 'agachar', equipamento: 'barra',
    nivel: 'avancado', focoPrincipal: 'Quadríceps, glúteos',
    musculosSecundarios: ['Posteriores', 'Core', 'Eretores da espinha'],
    descricao: 'Barra nas costas (trapézio), agache até as coxas ficarem paralelas ao chão (ou abaixo).',
    dicas: ['Pés na largura dos ombros, pontas levemente para fora', 'Joelhos acompanham a direção dos pés', 'Costas neutras, peito aberto', 'Respiração: inspire no topo, segure no fundo, expire subindo'],
    contraIndicacoes: ['Problema grave no joelho', 'Dor lombar crônica'],
    alerta50mais: 'Excelente para 50+ com técnica. Use rack de segurança. Comece com carga leve (até 50% peso corporal).',
  },
  {
    id: 'leg-press',
    nome: 'Leg press 45°',
    grupo: 'pernas', padraoMovimento: 'empurrar', equipamento: 'maquina',
    nivel: 'iniciante', focoPrincipal: 'Quadríceps, glúteos',
    musculosSecundarios: ['Posteriores'],
    descricao: 'Sentado na máquina, empurre a plataforma estendendo os joelhos.',
    dicas: ['Não travar os joelhos no topo', 'Descer controladamente', 'Pés na largura dos ombros (varia o foco)'],
    alerta50mais: 'Alternativa segura ao agachamento livre. Permite cargas altas com menor risco.',
  },
  {
    id: 'leg-extension',
    nome: 'Extensora (leg extension)',
    grupo: 'pernas', padraoMovimento: 'empurrar', equipamento: 'maquina',
    nivel: 'iniciante', focoPrincipal: 'Quadríceps',
    musculosSecundarios: [],
    descricao: 'Sentado, estenda o joelho levantando o peso.',
    dicas: ['Segure 1s no topo', 'Desça controladamente', 'Indicado para reabilitação'],
    alerta50mais: 'Cuidado com carga excessiva — pressão no joelho. Prefira amplitude média.',
  },
  {
    id: 'stiff',
    nome: 'Stiff (levantamento terra romeno)',
    grupo: 'pernas', padraoMovimento: 'hinge', equipamento: 'barra',
    nivel: 'intermediario', focoPrincipal: 'Posteriores de coxa',
    musculosSecundarios: ['Glúteos', 'Lombar', 'Eretores da espinha'],
    descricao: 'Em pé, desça a barra deslizando pelas pernas, mantendo joelhos quase estendidos. Volte à posição inicial contraindo glúteos.',
    dicas: ['Costas retas o tempo todo', 'Joelhos levemente flexionados (~15°)', 'Amplitude até sentir alongamento nos posteriores'],
    alerta50mais: 'Cuidado com mobilidade de quadril e lombar. Se sentir dor nas costas, pare. Prefira stiff com halter.',
  },
  {
    id: 'avanco',
    nome: 'Avanço (lunge)',
    grupo: 'pernas', padraoMovimento: 'agachar', equipamento: 'peso-corporal',
    nivel: 'iniciante', focoPrincipal: 'Quadríceps, glúteos',
    musculosSecundarios: ['Equilíbrio', 'Core'],
    descricao: 'Dê um passo à frente e desça até o joelho de trás quase tocar o chão. Alternar pernas.',
    dicas: ['Joelho da frente não ultrapassa muito a ponta do pé', 'Tronco ereto', 'Ótimo para equilíbrio'],
  },
  {
    id: 'panturrilha',
    nome: 'Elevação de panturrilha (em pé)',
    grupo: 'pernas', padraoMovimento: 'empurrar', equipamento: 'peso-corporal',
    nivel: 'iniciante', focoPrincipal: 'Gastrocnêmio (panturrilha)',
    musculosSecundarios: ['Sóleo'],
    descricao: 'Em pé, eleve-se nas pontas dos pés e desça controladamente.',
    dicas: ['Amplitude completa', 'Segure 1s no topo contraindo', 'Pode fazer com peso para mais carga'],
  },
  {
    id: 'agachamento-bulgaro',
    nome: 'Agachamento búlgaro (halter)',
    grupo: 'pernas', padraoMovimento: 'agachar', equipamento: 'halter',
    nivel: 'intermediario', focoPrincipal: 'Quadríceps, glúteos',
    musculosSecundarios: ['Equilíbrio'],
    descricao: 'Apoie um pé atrás em banco. Agache com a perna da frente.',
    dicas: ['Excelente para corrigir assimetrias', 'Tronco levemente à frente', 'Menos carga, mais equilíbrio'],
  },

  // ============ CORE ============
  {
    id: 'prancha',
    nome: 'Prancha (plank)',
    grupo: 'core', padraoMovimento: 'estatico', equipamento: 'peso-corporal',
    nivel: 'iniciante', focoPrincipal: 'Core (geral)',
    musculosSecundarios: ['Ombros', 'Glúteos'],
    descricao: 'Apoio nos antebraços e ponta dos pés, corpo em linha reta.',
    dicas: ['Não deixe o quadril cair nem subir demais', 'Core contraído o tempo todo', 'Mantenha respiração normal', 'Meta: 3x30s'],
  },
  {
    id: 'abdominal-bicicleta',
    nome: 'Abdominal bicicleta',
    grupo: 'core', padraoMovimento: 'rotacao', equipamento: 'peso-corporal',
    nivel: 'iniciante', focoPrincipal: 'Oblíquos, reto abdominal',
    musculosSecundarios: [],
    descricao: 'Deitado, cotovelo em direção ao joelho oposto, alternando.',
    dicas: ['Não puxe o pescoço', 'Foco na rotação do tronco, não no cotovelo', 'Movimento lento e controlado'],
  },
  {
    id: 'dead-bug',
    nome: 'Dead bug',
    grupo: 'core', padraoMovimento: 'estatico', equipamento: 'peso-corporal',
    nivel: 'iniciante', focoPrincipal: 'Core profundo',
    musculosSecundarios: [],
    descricao: 'Deitado, braços e pernas em 90°. Estenda braço e perna opostos, volte sem tocar o chão.',
    dicas: ['Mantenha lombar colada no chão', 'Movimento lento', 'Ótimo para estabilidade lombar'],
    alerta50mais: 'Excelente para 50+ — trabalha core sem pressionar a coluna.',
  },

  // ============ CARDIO ============
  {
    id: 'caminhada-rapida',
    nome: 'Caminhada rápida',
    grupo: 'cardio', padraoMovimento: 'correr', equipamento: 'nenhum',
    nivel: 'iniciante', focoPrincipal: 'Sistema aeróbico',
    musculosSecundarios: ['Pernas', 'Core'],
    descricao: 'Caminhada com passo acelerado (6-7 km/h). Mantenha FC na zona alvo.',
    dicas: ['Postura ereta', 'Braços soltos balanceando', 'Respiração ritmada', 'Pode ser em esteira ou rua'],
    alerta50mais: 'Excelente cardio de baixo impacto. Comece com 20min e vá progredindo.',
  },
  {
    id: 'bike',
    nome: 'Bike (ergométrica ou rua)',
    grupo: 'cardio', padraoMovimento: 'correr', equipamento: 'nenhum',
    nivel: 'iniciante', focoPrincipal: 'Sistema aeróbico',
    musculosSecundarios: ['Quadríceps', 'Glúteos'],
    descricao: 'Pedalada contínua em ritmo moderado.',
    dicas: ['Banco na altura certa (joelho levemente flexionado)', 'Cadência: 70-90 rpm', 'Pode ser indoor (spinning) ou rua'],
    alerta50mais: 'Baixo impacto articular. Ideal para 50+ que querem cardio sem stress no joelho.',
  },
  {
    id: 'natacao',
    nome: 'Natação',
    grupo: 'cardio', padraoMovimento: 'correr', equipamento: 'nenhum',
    nivel: 'intermediario', focoPrincipal: 'Sistema cardiovascular completo',
    musculosSecundarios: ['Corpo todo'],
    descricao: 'Natação crawl, peito ou costas em ritmo moderado.',
    dicas: ['Excelente para articulações (zero impacto)', 'Pode usar nadadeiras para mais resistência', 'Sessão ideal: 30-45min'],
    alerta50mais: 'MELHOR cardio para 50+: zero impacto, trabalha corpo todo, baixo risco de lesão.',
  },
  {
    id: 'eliptico',
    nome: 'Elíptico',
    grupo: 'cardio', padraoMovimento: 'correr', equipamento: 'nenhum',
    nivel: 'iniciante', focoPrincipal: 'Aeróbico + pernas',
    musculosSecundarios: ['Braços', 'Core'],
    descricao: 'Aparelho elíptico com movimento de pernas e braços simultâneos.',
    dicas: ['Menor impacto que corrida', 'Pode variar resistência e inclinação', 'Bom para reabilitação'],
  },

  // ============ MOBILIDADE ============
  {
    id: 'hip-flexor-stretch',
    nome: 'Alongamento de flexor do quadril',
    grupo: 'mobilidade', padraoMovimento: 'estatico', equipamento: 'nenhum',
    nivel: 'iniciante', focoPrincipal: 'Psoas ilíaco',
    musculosSecundarios: ['Quadríceps'],
    descricao: 'Ajoelhe em uma perna, outra à frente em 90°. Empurre o quadril à frente.',
    dicas: ['Mantenha 30-45s cada lado', 'Não force a coluna lombar', 'Respiração profunda'],
    alerta50mais: 'Crítico para 50+: encurtamento do psoas é comum em quem fica muito sentado.',
  },
  {
    id: '90-90-hip',
    nome: '90/90 quadril',
    grupo: 'mobilidade', padraoMovimento: 'estatico', equipamento: 'nenhum',
    nivel: 'iniciante', focoPrincipal: 'Rotação interna e externa do quadril',
    musculosSecundarios: ['Glúteos'],
    descricao: 'Sentado com ambas as pernas flexionadas a 90° (uma à frente, outra atrás). Trocar lados.',
    dicas: ['Mantenha coluna ereta', 'Não sinta dor no joelho', 'Ótimo aquecimento para pickleball'],
    alerta50mais: 'Importante para mobilidade do quadril — essencial para pickleball.',
  },
  {
    id: 'thoracic-rotation',
    nome: 'Rotação torácica',
    grupo: 'mobilidade', padraoMovimento: 'rotacao', equipamento: 'nenhum',
    nivel: 'iniciante', focoPrincipal: 'Coluna torácica',
    musculosSecundarios: ['Costas'],
    descricao: 'Em 4 apoios, mão na cabeça, gire o cotovelo em direção ao outro braço.',
    dicas: ['Mantenha quadril estável', 'Mobilidade torácica = melhor saque e smash', '10 reps cada lado'],
    alerta50mais: 'Tórax rígido é comum em 50+. Esse exercício ajuda no pickleball (saque, smash).',
  },
  {
    id: 'wall-slide',
    nome: 'Wall slide (deslizar na parede)',
    grupo: 'mobilidade', padraoMovimento: 'empurrar', equipamento: 'nenhum',
    nivel: 'iniciante', focoPrincipal: 'Mobilidade do ombro',
    musculosSecundarios: ['Trapézio'],
    descricao: 'Costas contra a parede, braços em W. Deslize para cima e para baixo mantendo contato.',
    dicas: ['Não arque a lombar', 'Cotovelos e mãos sempre na parede', '10-15 reps lentas'],
    alerta50mais: 'Excelente para saúde do manguito rotador.',
  },
  {
    id: 'cat-cow',
    nome: 'Gato-vaca (cat-cow)',
    grupo: 'mobilidade', padraoMovimento: 'rotacao', equipamento: 'nenhum',
    nivel: 'iniciante', focoPrincipal: 'Mobilidade da coluna',
    musculosSecundarios: ['Core'],
    descricao: 'Em 4 apoios, alterne entre arquear as costas (vaca) e arredondar (gato).',
    dicas: ['Movimento lento, com respiração', 'Alongar toda a coluna', '10 ciclos'],
  },

  // ============ ALONGAMENTO ============
  {
    id: 'hamstring-stretch',
    nome: 'Alongamento de posteriores',
    grupo: 'alongamento', padraoMovimento: 'estatico', equipamento: 'nenhum',
    nivel: 'iniciante', focoPrincipal: 'Isquiotibiais',
    musculosSecundarios: ['Panturrilha'],
    descricao: 'Sentado com perna estendida, alcance os pés sem dobrar o joelho.',
    dicas: ['Mantenha 30s cada lado', 'Respiração profunda', 'Não force: alongamento é confortável'],
  },
  {
    id: 'quad-stretch',
    nome: 'Alongamento de quadríceps',
    grupo: 'alongamento', padraoMovimento: 'estatico', equipamento: 'nenhum',
    nivel: 'iniciante', focoPrincipal: 'Quadríceps',
    musculosSecundarios: [],
    descricao: 'Em pé, puxe o pé em direção ao glúteo.',
    dicas: ['Mantenha joelhos juntos', 'Segure parede para equilíbrio', '30s cada lado'],
  },
  {
    id: 'peito-porta',
    nome: 'Alongamento de peito na porta',
    grupo: 'alongamento', padraoMovimento: 'estatico', equipamento: 'nenhum',
    nivel: 'iniciante', focoPrincipal: 'Peitoral',
    musculosSecundarios: ['Deltoide anterior'],
    descricao: 'Braço apoiado no batente da porta, dê um passo à frente sentindo alongar o peito.',
    dicas: ['Indicado para quem fica muito tempo sentado', 'Mantenha 30s cada lado'],
  },

  // ============ AQUECIMENTO ============
  {
    id: 'polichinelo',
    nome: 'Polichinelo',
    grupo: 'aquecimento', padraoMovimento: 'empurrar', equipamento: 'nenhum',
    nivel: 'iniciante', focoPrincipal: 'Aquecimento geral',
    musculosSecundarios: ['Pernas', 'Braços'],
    descricao: 'Salte abrindo e fechando pernas e braços simultaneamente.',
    dicas: ['30-60 segundos', 'Intensidade leve a moderada', 'Excelente para começar'],
  },
  {
    id: 'skipping',
    nome: 'Skipping',
    grupo: 'aquecimento', padraoMovimento: 'correr', equipamento: 'nenhum',
    nivel: 'iniciante', focoPrincipal: 'Aquecimento + coordenação',
    musculosSecundarios: ['Quadríceps', 'Panturrilha'],
    descricao: 'Corrida no lugar elevando bem os joelhos.',
    dicas: ['2 séries de 20m', 'Coordenar com balanço de braços', 'Bom aquecimento pré-treino'],
  },
];

export const GRUPOS_MUSCULARES: Record<string, { nome: string; icone: string; cor: string }> = {
  peito: { nome: 'Peito', icone: '💪', cor: 'rose' },
  costas: { nome: 'Costas', icone: '🏋️', cor: 'cyan' },
  ombro: { nome: 'Ombro', icone: '🤸', cor: 'amber' },
  bracos: { nome: 'Braços', icone: '💪', cor: 'orange' },
  pernas: { nome: 'Pernas', icone: '🦵', cor: 'emerald' },
  gluteos: { nome: 'Glúteos', icone: '🍑', cor: 'pink' },
  core: { nome: 'Core', icone: '🧱', cor: 'slate' },
  cardio: { nome: 'Cardio', icone: '❤️', cor: 'red' },
  mobilidade: { nome: 'Mobilidade', icone: '🤸', cor: 'blue' },
  aquecimento: { nome: 'Aquecimento', icone: '🔥', cor: 'rose' },
  alongamento: { nome: 'Alongamento', icone: '🧘', cor: 'teal' },
};

export const ALERTAS_50_MAIS_GERAIS = [
  'Priorize movimentos com peso corporal antes de carga livre',
  'Treine mobilidade todos os dias (5-10min)',
  'Aquecimento completo (5-10min) é inegociável',
  'Não treine até a falha — fique 1-2 reps RIR (reps in reserve)',
  'Recuperação: 48-72h entre sessões do mesmo grupo muscular',
  'Inclua trabalho de equilíbrio semanalmente',
];
