/**
 * Banco de Drills de Pickleball — sugestão para o usuário.
 * NÃO é o banco oficial. É uma lista curada para o autocomplete
 * no formulário de treino. O banco oficial fica em /toppkb_seed/drills
 * (Firestore) e pode ser atualizado pelo admin.
 */

export interface DrillSugestao {
  id: string;
  nome: string;
  categoria: 'dink' | 'volley' | 'serve' | 'return' | 'third-shot' | 'lob' | 'smash' | 'footwork' | 'estrategia' | 'aquecimento' | 'alongamento' | 'forca-mental';
  dificuldade: 'iniciante' | 'intermediario' | 'avancado' | 'pro';
  duracaoEstimadaMin: number;
  focoPrincipal: string;
  descricao: string;
  dicas: string[];
  equipamento?: string[];
}

export const DRILL_SUGESTOES: DrillSugestao[] = [
  // ============ DINK ============
  {
    id: 'dink-cross-1',
    nome: 'Dink cruzado em pares',
    categoria: 'dink',
    dificuldade: 'iniciante',
    duracaoEstimadaMin: 10,
    focoPrincipal: 'Toque suave, controle da bola na cozinha',
    descricao: 'Dois jogadores na cozinha, dink cruzado. Foco em colocar a bola na cozinha adversária.',
    dicas: [
      'Use o corpo, não só o braço — mova os pés',
      'Mantenha a raquete à frente do corpo, sempre',
      'Backhand primeiro se sentir instável',
      'Conte 1, 2, 3 entre os golpes (ritmo)',
      'Se o adversário atacar, devolva sempre em cima',
    ],
  },
  {
    id: 'dink-reto-1',
    nome: 'Dink reto em linha',
    categoria: 'dink',
    dificuldade: 'iniciante',
    duracaoEstimadaMin: 8,
    focoPrincipal: 'Controle de profundidade e consistência',
    descricao: 'Dink reto, ambos os jogadores tentando manter a bola o mais longe possível da rede adversária.',
    dicas: [
      'A bola deve quicar perto da cozinha adversária',
      'Evite bater forte — controle > potência',
      'Observe os ombros do adversário para antecipar',
    ],
  },
  {
    id: 'dink-rolando-1',
    nome: 'Dink com alvo (cone)',
    categoria: 'dink',
    dificuldade: 'intermediario',
    duracaoEstimadaMin: 10,
    focoPrincipal: 'Precisão direcional',
    descricao: 'Coloque 2 cones na cozinha adversária (um em cada lateral). Tente acertar os cones 20 vezes em sequência.',
    dicas: [
      'Use cones de vinil leve para não machucar',
      'Tente alternar cross, paralelo e meio',
      'Registre quantas acertou — tente melhorar 5% por semana',
    ],
  },
  {
    id: 'dink-speed-up-1',
    nome: 'Dink com speed-up progressivo',
    categoria: 'dink',
    dificuldade: 'avancado',
    duracaoEstimadaMin: 12,
    focoPrincipal: 'Defesa contra speed-up + decisão de quando acelerar',
    descricao: 'Dink normal por 5 bolas, depois um jogador acelera (speed-up) e o outro defende. Rodízio.',
    dicas: [
      'Speed-up não é smash — é bola rápida mas controlada',
      'Bloqueio: antecipe, raquete à frente, devolva curta',
      'Não devolva speed-up em speed-up — quase sempre dá ponto ao adversário',
    ],
  },

  // ============ VOLLEY ============
  {
    id: 'volley-parede-1',
    nome: 'Volley contra parede',
    categoria: 'volley',
    dificuldade: 'iniciante',
    duracaoEstimadaMin: 8,
    focoPrincipal: 'Reflexo e posição de raquete',
    descricao: 'Fique a 2m de uma parede, voleie sem deixar cair. Mantenha a raquete à frente, sempre.',
    dicas: [
      'Punho firme, sem apertar demais',
      'Cotovelo à frente do corpo',
      'Faça 50 sem errar para ser considerado bom',
    ],
  },
  {
    id: 'volley-pairs-1',
    nome: 'Volley em pares (sem deixar cair)',
    categoria: 'volley',
    dificuldade: 'intermediario',
    duracaoEstimadaMin: 10,
    focoPrincipal: 'Consistência e posicionamento',
    descricao: 'Dois jogadores a 3m, voleiam. Meta: 50 rallies sem errar.',
    dicas: [
      'Raquete à frente, sempre — não baixe depois da bola',
      'Movimente os pés, não fique parado',
      'Foque em: 70% de bolas no centro, 30% nas laterais',
    ],
  },
  {
    id: 'volley-block-1',
    nome: 'Volley block (defesa)',
    categoria: 'volley',
    dificuldade: 'avancado',
    duracaoEstimadaMin: 12,
    focoPrincipal: 'Bloqueio firme + devolução estratégica',
    descricao: 'Parceiro ataca forte, você bloqueia e devolve curto (em cima da rede ou no pé do adversário).',
    dicas: [
      'Bloqueio = amortecer, não devolver',
      'Devolução curta > devolução longa',
      'Raquete levemente aberta para cima',
    ],
  },

  // ============ SERVE ============
  {
    id: 'serve-deep-1',
    nome: 'Serve profundo (alvo)',
    categoria: 'serve',
    dificuldade: 'iniciante',
    duracaoEstimadaMin: 8,
    focoPrincipal: 'Consistência e profundidade',
    descricao: 'Marque uma linha a 1m da linha de fundo adversária. 20 saques tentando acertar a área.',
    dicas: [
      'Solte a bola com cuidado, não jogue para baixo',
      'Contato limpo no centro da raquete',
      'Siga em frente com o corpo, não pare após o saque',
    ],
  },
  {
    id: 'serve-spin-1',
    nome: 'Serve com spin (top/slice)',
    categoria: 'serve',
    dificuldade: 'avancado',
    duracaoEstimadaMin: 10,
    focoPrincipal: 'Variação de saque',
    descricao: 'Pratique 3 tipos: top spin (bola cai rápido), slice (bola quica para o lado), flat (sem rotação).',
    dicas: [
      'Top spin: pegue a bola embaixo e raspe para cima',
      'Slice: pegue a bola do lado e raspe para o lado',
      'Variação de saque confunde o return do adversário',
    ],
  },

  // ============ THIRD SHOT ============
  {
    id: 'third-shot-drop-1',
    nome: 'Third shot drop',
    categoria: 'third-shot',
    dificuldade: 'intermediario',
    duracaoEstimadaMin: 15,
    focoPrincipal: 'Toque suave para colocar a bola na cozinha após o saque',
    descricao: 'Após o saque, o terceiro shot deve ser um drop na cozinha. Essencial para pickleball.',
    dicas: [
      'Paciência é a chave — não tente winners',
      'Use a gravidade a seu favor: pegue a bola no topo do quique',
      'Drop = amaciamento do backhand/lob',
      'Aprenda a fazer drop com forehand E backhand',
    ],
  },
  {
    id: 'third-shot-dink-1',
    nome: 'Third shot drop → dink',
    categoria: 'third-shot',
    dificuldade: 'avancado',
    duracaoEstimadaMin: 15,
    focoPrincipal: 'Sequência completa: serve → drop → dink',
    descricao: 'Saque → terceiro shot drop → dink em rally. Foco em chegar à cozinha sempre.',
    dicas: [
      'Terceiro shot é a jogada mais importante do pickleball',
      '70% drop, 30% drive (em iniciantes)',
      'Avançados: varia drop/drive/lob dependendo do posicionamento',
    ],
  },
  {
    id: 'third-shot-lob-1',
    nome: 'Third shot lob',
    categoria: 'third-shot',
    dificuldade: 'intermediario',
    duracaoEstimadaMin: 8,
    focoPrincipal: 'Lob alto para resetar o ponto',
    descricao: 'Em vez de drop, faça um lob alto que sobre a cabeça do adversário na rede.',
    dicas: [
      'Use quando adversário está em cima da rede',
      'Altura > profundidade',
      'Logo após o lob, CORRA para a cozinha',
    ],
  },

  // ============ LOB ============
  {
    id: 'lob-defesa-1',
    nome: 'Defesa de lob (smash)',
    categoria: 'lob',
    dificuldade: 'avancado',
    duracaoEstimadaMin: 10,
    focoPrincipal: 'Devolução defensiva de smash',
    descricao: 'Parceiro faz smash, você defende. Foco em manter a bola em jogo.',
    dicas: [
      'Bloqueio é o melhor amigo',
      'Não tente winner na defesa de smash',
      'Devolução cruzada > paralela (mais ângulo)',
    ],
  },
  {
    id: 'lob-ofensivo-1',
    nome: 'Lob ofensivo (por cima)',
    categoria: 'lob',
    dificuldade: 'avancado',
    duracaoEstimadaMin: 8,
    focoPrincipal: 'Lob alto com objetivo de passar o adversário na rede',
    descricao: 'A partir do fundo, faça lob alto e angulado que passe pela lateral do adversário.',
    dicas: [
      'Timing: adversário está em cima da rede',
      'Altura e ângulo > força',
      'Tenha plano B: se o lob não passar, prepare defesa',
    ],
  },

  // ============ SMASH ============
  {
    id: 'smash-basico-1',
    nome: 'Smash / overhead básico',
    categoria: 'smash',
    dificuldade: 'intermediario',
    duracaoEstimadaMin: 10,
    focoPrincipal: 'Overhead consistente',
    descricao: 'Parceiro faz lob alto, você smash. Foco em colocar a bola dentro da quadra.',
    dicas: [
      'Não tente matar todas — coloque primeiro',
      'Contato no ponto mais alto possível',
      'Salto quando necessário (smash de lob alto)',
    ],
  },

  // ============ FOOTWORK ============
  {
    id: 'footwork-lateral-1',
    nome: 'Footwork lateral (shuffle)',
    categoria: 'footwork',
    dificuldade: 'iniciante',
    duracaoEstimadaMin: 5,
    focoPrincipal: 'Movimento lateral na cozinha',
    descricao: 'Em linha, shuffle lateral 5m ida e volta. 10 repetições.',
    dicas: [
      'Pés paralelos, sempre',
      'Não cruze os pés',
      'Mantenha a raquete à frente',
    ],
    equipamento: ['Cones (opcional)'],
  },
  {
    id: 'footwork-4-cantos-1',
    nome: 'Footwork 4 cantos',
    categoria: 'footwork',
    dificuldade: 'avancado',
    duracaoEstimadaMin: 8,
    focoPrincipal: 'Reação rápida em todas as direções',
    descricao: 'Toque 4 alvos nos cantos da cozinha em sequência aleatória. Tempo: meta < 3s por ciclo.',
    dicas: [
      'Pés sempre prontos, joelhos semi-flexionados',
      'Movimento explosivo, depois recupere posição central',
    ],
  },

  // ============ ESTRATÉGIA ============
  {
    id: 'estrategia-posicao-1',
    nome: 'Posição na cozinha (par ou ímpar)',
    categoria: 'estrategia',
    dificuldade: 'intermediario',
    duracaoEstimadaMin: 10,
    focoPrincipal: 'Coordenação com parceiro de duplas',
    descricao: 'Em duplas, pratique movimentação sincronizada: quem vai pro meio, quem abre lateral.',
    dicas: [
      'Regra: o jogador do forehand fica do lado direito',
      'Movimento em "ferradura" — lateral + frente',
      'Comunique-se com seu parceiro',
    ],
  },
  {
    id: 'estrategia-decisao-1',
    nome: 'Árvore de decisão (drive vs drop)',
    categoria: 'estrategia',
    dificuldade: 'avancado',
    duracaoEstimadaMin: 12,
    focoPrincipal: 'Decidir quando acelerar vs amaciar',
    descricao: 'Em rally, o jogador decide e chama: "drive" ou "drop". Discuta com o parceiro: por que escolheu?',
    dicas: [
      'Drop se adversário está na cozinha esperando',
      'Drive se adversário está recuado',
      'Erro comum: drive quando deveria ser drop (ceder rede)',
    ],
  },

  // ============ AQUECIMENTO ============
  {
    id: 'aquecimento-leve-1',
    nome: 'Aquecimento leve (5 min)',
    categoria: 'aquecimento',
    dificuldade: 'iniciante',
    duracaoEstimadaMin: 5,
    focoPrincipal: 'Aquecer corpo antes de jogar',
    descricao: '5 min: polichinelos, corrida no lugar, rotação de ombros, agachamentos.',
    dicas: [
      'Sempre faça aquecimento — reduz risco de lesão',
      'Inclua mobilidade de punho e ombro',
    ],
  },

  // ============ ALONGAMENTO ============
  {
    id: 'alongamento-pos-1',
    nome: 'Alongamento pós-treino',
    categoria: 'alongamento',
    dificuldade: 'iniciante',
    duracaoEstimadaMin: 8,
    focoPrincipal: 'Recuperação muscular',
    descricao: '8 min: panturrilha, posterior, quadríceps, ombro, punho, costas.',
    dicas: [
      'Mantenha cada alongamento por 30s+',
      'Não faça alongamento balístico (com solavancos)',
      'Alongamento pós-treino é mais importante que pré',
    ],
  },

  // ============ FORÇA MENTAL ============
  {
    id: 'mental-reset-1',
    nome: 'Reset mental entre pontos',
    categoria: 'forca-mental',
    dificuldade: 'intermediario',
    duracaoEstimadaMin: 5,
    focoPrincipal: 'Gestão emocional em jogo',
    descricao: 'Após cada ponto: 3 respirações profundas, repita uma palavra-chave ("próximo" ou "foco").',
    dicas: [
      'Não fique preso a erro passado',
      'Rotina entre pontos = menos ansiedade',
      'Palavra-chave pessoal: curta, motivadora',
    ],
  },
  {
    id: 'mental-visualizacao-1',
    nome: 'Visualização pré-jogo',
    categoria: 'forca-mental',
    dificuldade: 'avancado',
    duracaoEstimadaMin: 10,
    focoPrincipal: 'Preparação mental antes de competir',
    descricao: 'Antes de torneio: 10 min deitado, feche os olhos, visualize-se jogando bem. Detalhe: sons, cores, sensações.',
    dicas: [
      'Atletas de elite fazem visualização 10 min/dia',
      'Visualize acertos E recuperação de erros',
      'Quanto mais vívido, mais eficaz',
    ],
  },
];

export const DRILL_CATEGORIAS = [
  { id: 'dink', nome: 'Dink', icone: '🎯', cor: 'emerald' },
  { id: 'volley', nome: 'Volley', icone: '⚡', cor: 'amber' },
  { id: 'serve', nome: 'Saque', icone: '🏓', cor: 'blue' },
  { id: 'return', nome: 'Devolução', icone: '↩️', cor: 'cyan' },
  { id: 'third-shot', nome: 'Third Shot', icone: '🎪', cor: 'purple' },
  { id: 'lob', nome: 'Lob', icone: '🎈', cor: 'pink' },
  { id: 'smash', nome: 'Smash', icone: '💥', cor: 'red' },
  { id: 'footwork', nome: 'Footwork', icone: '🦶', cor: 'orange' },
  { id: 'estrategia', nome: 'Estratégia', icone: '🧠', cor: 'indigo' },
  { id: 'aquecimento', nome: 'Aquecimento', icone: '🔥', cor: 'rose' },
  { id: 'alongamento', nome: 'Alongamento', icone: '🧘', cor: 'teal' },
  { id: 'forca-mental', nome: 'Força Mental', icone: '💭', cor: 'violet' },
] as const;
