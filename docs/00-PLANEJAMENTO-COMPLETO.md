# 🏓 Top Pickleball 50+ — Planejamento Completo

> Documento central. Comece por aqui para entender o projeto inteiro.

---

## 1. O que é

**Top Pickleball 50+** é uma plataforma pessoal de gestão esportiva para um atleta amador cujo objetivo é ser o melhor jogador de pickleball 50+ do Brasil até 2032.

O app é o **centro de comando** da jornada: registra treinos, partidas, preparação física, alimentação, sono, peso, dores, estudos e torneios. Tem **5 agentes de IA especializados** que orientam técnica, fisio, nutrição e estratégia competitiva.

**Não é:** rede social, marketplace, app genérico de fitness, ferramenta de coach profissional.
**É:** diário de bordo inteligente + assistente técnico/tático/físico/nutricional + planejador de carreira competitiva, **100% focado no objetivo traçado**.

---

## 2. Perfil do Atleta (do briefing)

| Item | Valor |
|---|---|
| Idade atual | 44 anos |
| Idade-alvo | 50+ (2032) |
| Peso atual | 95 kg |
| Altura | 1,79 m |
| IMC | 29,6 (sobrepeso leve) |
| Nível | Iniciante bom |
| Lesões ativas | 🦵 Joelho direito (prioridade #1) + 💪 Ombro esquerdo (prioridade #2) |
| Tempo disponível | 15 h/semana |
| Onde joga | Clubes com amigos |
| Já compete | Sim |
| Meta | Ser o melhor 50+ do Brasil em 6 anos |

---

## 3. Objetivos do Produto

### 3.1 Objetivo final
Apoiar o atleta a chegar ao topo da categoria 50+ brasileira em 2032.

### 3.2 Objetivos intermediários (12 meses)
- **M1-M3:** Saúde + base (zerar dores, -5kg, dominar fundamentos)
- **M4-M6:** Performance (-5kg, 60%+ vitórias, primeiro torneio)
- **M7-M9:** Tática + emagrecimento (-4kg finais, jogo completo)
- **M10-M12:** Consolidação (80kg, top 20% regional)

### 3.3 Restrições inegociáveis
- **Saúde antes de performance** — nunca sugerir algo que piore as lesões
- **Progressão gradual** (5-10% por semana)
- **Comida brasileira acessível** (não americana)
- **Adaptações para 50+** (longevidade > potência)
- **Não prescrição médica** — protocolos preventivos, não tratamento

---

## 4. Personas de IA (os 5 agentes)

| Persona | Tema | Quando usar |
|---|---|---|
| 🏓 **Coach Bruno** — Treinador | Pickleball técnico/tático | Drills, duplas, mental game, regras |
| 💪 **Prof. Marcos** — Preparador Físico | Fisio, força, mobilidade, cardio | Lesões, força, prevenção |
| 🥗 **Dra. Ana** — Nutricionista | Alimentação anti-inflamatória | Refeições, suplementos, déficit calórico |
| 🧠 **Coach Carla** — Estrategista | Torneios, ranking, métricas | Calendário, DUPR, avaliação mensal |
| 🤖 **Assistente Geral** | Navegação e suporte | Saudação, funcionalidades, feedback |

**Detecção automática** por palavras-chave (router) OU escolha manual do atleta.

---

## 5. Funcionalidades do MVP

### 5.1 Registros (CRUD isolado por usuário)
- 🏓 Treinos (data, tipo, duração, intensidade, drills, RPE, dores)
- 🎾 Partidas (data, adversário, placar, resultado, estatísticas)
- 💪 Fisio (sessões, exercícios, dores, observações do profissional)
- 🏋️ Força (sessão, divisão, exercícios, séries, RPE)
- 🤸 Mobilidade (sessão, foco, exercícios)
- 🏃 Cardio (tipo, duração, FC média/máx)
- 🥗 Refeições (alimentos, macros calculados, contexto treino/descanso)
- 💧 Água (quantidade, contexto)
- 💊 Suplementos (nome, dose, horário)
- ⚖️ Peso + medidas (cintura, quadril, coxa, braço)
- 😴 Sono (duração, qualidade)
- 🩹 Dores (região, intensidade 0-10, tipo, contexto, gatilhos)
- 📚 Estudos (tipo, fonte, tópico, resumo)
- 🏆 Torneios (nome, data, local, status, resultado, jogos)
- 🎯 Metas SMART (tipo, prazo, valor atual/alvo, progresso)
- 📊 Avaliações mensais (template com 30+ métricas)

### 5.2 Inteligência
- Chat com 5 agentes (auto-detecção de tema)
- Resumo semanal automático (gerado domingo 20h)
- Alerta de dor aguda (>=7/10 dispara notificação)
- Sugestões proativas (próximo treino, próxima refeição, etc)
- Análise de tendência (peso, performance, dores)

### 5.3 Visualização
- Dashboard com 4 KPIs principais (peso, ranking, dor, meta)
- Gráfico de peso (90 dias)
- Calendário de treinos (heatmap)
- Calendário de torneios
- Gráfico de evolução de performance
- Heatmap de dores

### 5.4 LGPD
- ✅ Exportar todos os dados (JSON)
- ✅ Deletar conta (remove tudo)
- ✅ Consentimento explícito
- ✅ Isolamento total por usuário (Firestore Rules)

---

## 6. Arquitetura (visão geral)

```
┌─────────────────────────────────────────────────────────────┐
│                     NAVEGADOR (Atleta)                      │
│  React 18 + Vite + TS + Tailwind + shadcn-style + Zustand  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Hosting (CDN)                    │
│  - frontend/dist (build estático)                           │
│  - rewrites /api/** → Cloud Function `api`                  │
└──────────┬────────────────────────────────────┬─────────────┘
           │                                    │
           ▼                                    ▼
┌──────────────────────┐           ┌──────────────────────────┐
│  Firebase Auth       │           │  Cloud Functions         │
│  Magic Link (e-mail) │           │  Node 20 + TypeScript    │
│  → user.uid          │           │  - api (router)          │
└──────────┬───────────┘           │  - chat (IA)             │
           │                       │  - registros (CRUD)      │
           ▼                       │  - metricas (agregação)  │
┌──────────────────────┐           │  - admin (futuro)        │
│  Firestore           │◄──────────┤                          │
│  /users/{uid}/...    │  AdminSDK │  → Gemini 2.5 Flash/Pro  │
│  (isolado por user)  │           │  → Sentry (logs)         │
└──────────────────────┘           └──────────────────────────┘
```

Detalhes completos em [`02-ARQUITETURA.md`](./02-ARQUITETURA.md).

---

## 7. Stack (clone do Cofrito)

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | React | 18.3.1 |
| Build | Vite | 5.3 |
| Linguagem | TypeScript | 5.5 |
| Estilo | Tailwind CSS | 3.4 |
| UI Base | shadcn-style (Radix UI) | 1.1 |
| Estado | Zustand | 4.5 |
| Server state | TanStack Query | 5.51 |
| Roteamento | React Router DOM | 6.26 |
| Forms | React Hook Form + Zod | 7.52 / 3.23 |
| Auth | Firebase Auth (Magic Link) | 10.13 |
| DB | Firestore (Native + Vector) | 12.3 admin |
| Backend | Cloud Functions (Node 20) | 5.0.1 |
| IA | Gemini 2.5 Flash (default) + Pro (longo) | 0.17 SDK |
| Email | Resend | 3.4 |
| Hospedagem | Firebase Hosting | — |
| Obs | Sentry | — |
| CI/CD | GitHub Actions | — |
| Idioma | i18next (PT-BR default) | 23.12 |

---

## 8. Estrutura do Repositório

```
toppkb/
├── docs/                    # este diretório
├── frontend/                # React app
├── functions/               # Cloud Functions + IA
├── data/raw/                # material de estudo (PDFs, vídeos)
├── scripts/                 # utilitários de ingestão
├── tools/                   # shell scripts de setup/deploy
├── .github/workflows/       # CI/CD
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── .firebaserc
├── .env.example
└── package.json             # workspace root
```

---

## 9. Status e Roadmap

**Status atual:** Estrutura completa entregue (este commit).

**Roadmap de implementação:** 8 sprints, ~6-8 semanas para MVP público.

| Sprint | Tema | Status |
|---|---|---|
| 0 | Setup do projeto | ✅ |
| 1 | Fundação frontend (login, onboarding, layout) | 🚧 |
| 2 | Fundação backend (rules, indexes, auth) | 🚧 |
| 3 | Registros (CRUD de 6 tipos) | ⏳ |
| 4 | Chat com 5 agentes IA | ⏳ |
| 5 | Dashboard e métricas | ⏳ |
| 6 | Resumo IA + torneios | ⏳ |
| 7 | Polish + LGPD + deploy | ⏳ |

Detalhes em [`10-ROADMAP-PRODUTO.md`](./10-ROADMAP-PRODUTO.md).

---

## 10. Como começar (para o atleta)

### Dia 1 (hoje)
1. Criar conta Google / Firebase
2. Ativar Auth (Magic Link) + Firestore + Functions + Hosting
3. Adicionar `GEMINI_API_KEY` no `.env.local`
4. Clonar este repo
5. Rodar `npm install` em `frontend/` e `functions/`
6. Rodar emuladores: `cd functions && npm run serve`
7. Abrir `http://localhost:5173`

### Semana 1
1. Cadastrar-se no app (e-mail + magic link)
2. Completar onboarding (5 perguntas)
3. Registrar peso atual + medidas
4. Preencher baseline de dores (joelho D + ombro E)
5. Registrar 1ª refeição

### Mês 1
1. Registrar 80%+ das refeições
2. Pesar-se 1x/semana
3. Registrar todos os treinos (15h/semana)
4. Conversar com a IA pelo menos 3x/semana
5. Preencher avaliação mensal

---

## 11. Frase da jornada

> *"Em 2032, quando eu tiver 50 anos e estiver jogando o Brasileirão 50+, vou lembrar de 2026 — o dia que decidi virar o melhor. E vou agradecer."*

---

**Versão:** 0.1.0
**Data:** 2026-08-17
**Próxima revisão:** mensal (todo dia 17)
