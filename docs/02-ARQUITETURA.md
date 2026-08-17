# 🏗️ Arquitetura — Top Pickleball 50+

> Visão técnica detalhada do sistema.

---

## 1. Princípios arquiteturais

1. **Isolamento total por usuário** — Firestore Rules garantem que cada atleta só lê/escreve seus próprios dados. Inspirado e idêntico ao padrão Cofrito.
2. **Backend thin + IA no Functions** — Cloud Functions só orquestram e validam. Toda a regra de negócio fica no client + rules.
3. **Multi-agente** — 5 personas de IA com prompts especializados e roteamento por keyword. Cada agente é uma skill.
4. **Custo mínimo** — Gemini 2.5 Flash (barato), Firestore Spark (grátis até limite), Cloud Functions só sob demanda.
5. **Offline-first quando possível** — TanStack Query faz cache local, navegação funciona sem rede.

---

## 2. Topologia

```
┌─────────────────────────────────────────────────────────────┐
│                     ATLETA (Browser)                         │
│  React 18 + Vite + TS + Tailwind + shadcn-style            │
│  - Zustand (auth, ui)                                        │
│  - TanStack Query (server state)                             │
│  - React Router 6                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Firebase    │  │ Firebase    │  │ Firebase    │
│ Auth        │  │ Firestore   │  │ Cloud       │
│ (Magic Link)│  │ (Realtime)  │  │ Functions   │
└─────────────┘  └─────────────┘  └──────┬──────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │ Gemini 2.5      │
                                │ Flash / Pro     │
                                │ (5 agentes)     │
                                └─────────────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │ Sentry          │
                                │ (erros + perf)  │
                                └─────────────────┘
```

---

## 3. Estrutura de pastas

```
toppkb/
├── docs/                            # documentação
│   ├── 00-PLANEJAMENTO-COMPLETO.md
│   ├── 01-INSTALACAO.md
│   ├── 02-ARQUITETURA.md
│   ├── 03-DEPLOY.md
│   ├── 04-OPERACAO.md
│   ├── 05-LGPD-SEGURANCA.md
│   ├── 06-API-REFERENCE.md
│   ├── 07-AGENTES-PROMPTS.md
│   ├── 08-TESTES.md
│   ├── 09-MONITORAMENTO.md
│   ├── 10-ROADMAP-PRODUTO.md
│   ├── 11-PERFIL-ATLETA.md
│   └── adr/                         # Architecture Decision Records
│       ├── 0001-stack.md
│       ├── 0002-llm-gemini.md
│       ├── 0003-isolamento-por-user.md
│       ├── 0004-multi-agente.md
│       └── 0005-magic-link.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                  # primitivos shadcn-style
│   │   │   ├── layout/              # AppShell, Sidebar, Header
│   │   │   ├── registros/           # Formulários por pilar
│   │   │   ├── dashboard/           # Widgets do painel
│   │   │   ├── chat/                # Chat com IA
│   │   │   └── common/              # ConfirmDialog, etc
│   │   ├── pages/                   # rotas (30+)
│   │   ├── hooks/                   # useAuth, useRegistros, etc
│   │   ├── stores/                  # Zustand stores
│   │   ├── lib/                     # firebase, api, schemas
│   │   ├── i18n/                    # PT-BR
│   │   ├── types/                   # TypeScript types
│   │   ├── assets/                  # imagens, ícones
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/                      # assets estáticos
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .eslintrc.cjs
│
├── functions/
│   ├── src/
│   │   ├── index.ts                 # exports
│   │   ├── handlers/
│   │   │   ├── auth.ts              # onCreate user
│   │   │   ├── api.ts               # router /api/**
│   │   │   ├── chat.ts              # chat com IA
│   │   │   ├── scheduled.ts         # cron jobs
│   │   │   └── admin.ts
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── router.ts        # detecção de agente
│   │   │   │   ├── treinador.ts     # persona Treinador
│   │   │   │   ├── preparador.ts    # persona Preparador
│   │   │   │   ├── nutricionista.ts # persona Nutricionista
│   │   │   │   ├── estrategista.ts  # persona Estrategista
│   │   │   │   ├── general.ts       # persona General
│   │   │   │   └── embeddings.ts
│   │   │   ├── firestore/
│   │   │   │   ├── user.ts
│   │   │   │   ├── registros.ts
│   │   │   │   └── metricas.ts
│   │   │   ├── ratelimit.ts
│   │   │   ├── email.ts
│   │   │   └── sentry.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── consent.ts
│   │   │   └── ratelimit.ts
│   │   ├── prompts/                 # system prompts .md
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── feature-flags.ts
│   │   └── utils/
│   ├── package.json
│   ├── tsconfig.json
│   └── .eslintrc.cjs
│
├── data/raw/                        # material de estudo
├── scripts/                         # utilitários
├── tools/                           # shell scripts
├── .github/workflows/               # CI/CD
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── .firebaserc
├── .env.example
└── package.json                     # workspace root
```

---

## 4. Modelo de dados (resumo)

### Coleções por usuário (`/users/{uid}/...`)

| Coleção | Conteúdo | Volume esperado |
|---|---|---|
| `treinos/` | Treinos de pickleball | ~20/mês → 240/ano |
| `partidas/` | Partidas disputadas | ~10/mês → 120/ano |
| `fisio/` | Sessões de fisio | ~8/mês → 96/ano |
| `forca/` | Sessões de musculação | ~8/mês → 96/ano |
| `mobilidade/` | Mobilidade diária | ~30/mês → 360/ano |
| `cardio/` | Cardio | ~8/mês → 96/ano |
| `refeicoes/` | Refeições registradas | ~120/mês → 1440/ano |
| `agua/` | Copos de água | ~30/mês |
| `suplementos/` | Ingestão | ~30/mês |
| `peso/` | Pesagens | ~4/mês |
| `medidas/` | Medidas corporais | ~4/mês |
| `sono/` | Noites de sono | ~30/mês |
| `dores/` | Episódios de dor | ~5/mês |
| `avaliacoes/` | Avaliação mensal | 1/mês → 12/ano |
| `estudos/` | Sessões de estudo | ~10/mês |
| `torneios/{id}/jogos/` | Torneios + subcoleção de jogos | ~3/mês |
| `metas/` | Metas SMART | ~5 ativas |
| `conversas/{id}/messages/` | Chat com IA | ~50/mês |
| `feedback/` | Feedback de mensagens | esparso |
| `agregados/` | Cache de métricas | 1/mês |

**Total por usuário/ano:** ~3.000 documentos.

**Limite do plano Spark (grátis):** 20k reads/dia e 1GB storage. Suficiente para 1-5 usuários.

---

## 5. Fluxo de uma requisição

### Exemplo: atleta pede conselho à IA

```
1. Usuário digita "Como melhorar meu dink?"
   ↓
2. Frontend (ChatInput.tsx)
   - Optimistic update: mostra mensagem do user
   - POST /api/chat/message { mensagem: "...", agente: "auto" }
   ↓
3. Cloud Function `api` (Express router)
   - authMiddleware: valida JWT
   - consentMiddleware: confirma consent
   - rateLimitMiddleware: < 20 req/min
   ↓
4. Handler chatMessage
   - Cria/atualiza conversa
   - Persiste mensagem do user
   - Carrega contexto (últimas 5 msgs + últimos 10 treinos + últimas 5 dores)
   - Chama services/ai/router.detectarAgente("Como melhorar meu dink?")
   - Retorna: "treinador"
   ↓
5. services/ai/treinador.responder()
   - Carrega system prompt do treinador
   - Monta prompt completo
   - Chama Gemini 2.5 Flash
   - Retorna texto
   ↓
6. Handler persiste resposta
   - Cria doc em conversas/{id}/messages/ com role=assistant, agente=treinador
   - Atualiza conversa.updatedAt
   - Audit log
   ↓
7. Frontend recebe resposta
   - ChatMessage.tsx renderiza com AgentBadge "🏓 Treinador"
```

**Latência total:** 1-3s (Gemini Flash).

---

## 6. Multi-agente IA

### 6.1 Router de agente

```ts
function detectarAgente(mensagem: string): AgenteId {
  const m = mensagem.toLowerCase();
  const scores = { treinador: 0, preparador: 0, nutricionista: 0, estrategista: 0, general: 0 };

  // +1 para cada keyword de cada agente
  for (const [agente, kws] of Object.entries(KEYWORDS)) {
    for (const kw of kws) {
      if (m.includes(kw)) scores[agente]++;
    }
  }

  // Bônus: corpo humano → preparador
  if (/\b(joelho|ombro|costas|pulso|tornozelo|quadril)\b/.test(m)) {
    scores.preparador += 2;
  }

  // Retorna o top, ou 'general' se nenhum pontuou
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return top[1] > 0 ? top[0] : 'general';
}
```

### 6.2 Conflito de agentes

Se a mensagem tem múltiplos temas, o agente principal responde e **sugere** os outros no final:

> ⚠️ "Vi que a dor no joelho está em 5/10. Quer que eu chame o Preparador Físico?"

---

## 7. Segurança

### 7.1 Camadas
1. **HTTPS** em toda comunicação (Firebase Hosting + Functions HTTPS)
2. **Firebase Auth** (Magic Link + ID Token verificado em cada request)
3. **Firestore Rules** (isolamento total + admin only p/ corpus)
4. **Storage Rules** (20MB por arquivo, owner only)
5. **Rate limiting** (20 chat/min, 60 registros/min, 1 delete/dia)
6. **CSP rigoroso** (sem inline scripts externos, origens específicas)
7. **HSTS** (1 ano, includeSubDomains, preload)
8. **LGPD** (exportar + deletar conta)

### 7.2 Variáveis sensíveis
- `GEMINI_API_KEY` → `admin-config/llm-secret` (apenas Admin SDK lê)
- `serviceAccountKey.json` → nunca commitado, apenas local
- `GITHUB_PAT` → só em GitHub Secrets p/ CI/CD

---

## 8. Performance

### 8.1 Frontend
- **Code splitting** automático do Vite
- **Lazy load** de rotas (`React.lazy`)
- **TanStack Query cache** (evita refetch desnecessário)
- **Recharts** com `isAnimationActive={false}` em mobile
- **Imagens** otimizadas (WebP quando possível)
- **PWA** instalável (service worker — fase 2)

### 8.2 Backend
- **Cloud Functions Gen 2** (cold start < 1s)
- **Firestore indexes** para queries frequentes (16 índices criados)
- **Cache de contexto do usuário** (in-memory, 5min TTL)
- **Streaming de resposta da IA** (SSE — fase 2)

### 8.3 Banco
- **Composite indexes** em todas as queries com `where` + `orderBy`
- **Pagination** (limite 20/página)
- **TTL** automático em agregados (90 dias)

---

## 9. Decisões arquiteturais (ADRs)

| ADR | Decisão | Por quê |
|---|---|---|
| 0001 | React + Vite + TS + Tailwind | Performance + DX |
| 0002 | Gemini 2.5 Flash (não OpenAI/Claude) | Custo (~$0.075/1M tokens) + qualidade p/ PT-BR |
| 0003 | Isolamento total por user no Firestore | LGPD + segurança |
| 0004 | Multi-agente (5 personas) + router | Especialização da IA por domínio |
| 0005 | Auth Magic Link (sem senha) | UX + segurança |
| 0006 | Cloud Functions Gen 2 (não 1ª gen) | Tempo de execução 60min, triggers novos |

Detalhes em [`docs/adr/`](./adr/).

---

## 10. Limitações conhecidas

- **Cold start** das Cloud Functions: 3-10s na 1ª chamada do dia
- **Gemini rate limit** free tier: 15 req/min
- **Firestore Spark** limite: 20k reads/dia (suficiente p/ 1-5 usuários)
- **Sem real-time de chat** (Fase 2: Firestore listener)
- **Sem vídeo upload** (Fase 2: Firebase Storage)

---

## Próximo

[`03-DEPLOY.md`](./03-DEPLOY.md) — como colocar em produção.
