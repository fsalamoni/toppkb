# Arquitetura — Top Pickleball 50+

## Visão geral

Aplicação **full-stack** com isolamento total por usuário. Inspirada estruturalmente no projeto Cofrito, mas customizada para o domínio de pickleball 50+.

```
┌──────────────────────────────────────────────────────────┐
│ Frontend (React 18 + Vite + TS + Tailwind)              │
│  - PWA (instalável, offline-ready)                       │
│  - React Router + React Query                            │
│  - Zustand (auth, ui, chat)                              │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ HTTPS
                       ↓
┌──────────────────────────────────────────────────────────┐
│ Firebase Auth (Magic Link) + Hosting + App Check         │
└──────────────────────┬───────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ↓                             ↓
┌──────────────────┐         ┌────────────────────────┐
│  REST API        │         │  Cloud Functions v2    │
│  (Express-like)  │         │  (Callable + Scheduled)│
│  /api/**         │         │                        │
└──────┬───────────┘         └──────┬─────────────────┘
       │                            │
       └─────────────┬──────────────┘
                     ↓
       ┌──────────────────────────────────────┐
       │  Firestore (NoSQL)                   │
       │  - users/{uid}/<17 subcoleções>      │
       │  - corpus (compartilhado, RAG)       │
       │  - admin-config (configs globais)    │
       │  - audit (LGPD)                      │
       └──────────────────────────────────────┘
                     ↓
       ┌──────────────────────────────────────┐
       │  Gemini (LLM + Embeddings)           │
       │  + 16 outros providers               │
       └──────────────────────────────────────┘
```

## Stack

### Frontend

| Camada | Tech |
|--------|------|
| Framework | React 18 |
| Build | Vite 5 |
| Linguagem | TypeScript 5 |
| Styling | TailwindCSS 3 + shadcn/ui |
| State | Zustand + React Query |
| Routing | React Router 6 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| PWA | vite-plugin-pwa |
| Testes | Vitest + Playwright |

### Backend

| Camada | Tech |
|--------|------|
| Runtime | Node 20 (Cloud Functions Gen 2) |
| Linguagem | TypeScript 5 |
| Framework | Express-like (manual routing) |
| DB | Firestore (Native mode) |
| Auth | Firebase Auth (Magic Link) |
| AI | Google Generative AI SDK (Gemini) |
| Search | Firestore Vector Search |
| Testes | Vitest |

### Infra

| Camada | Tech |
|--------|------|
| Auth | Firebase Auth |
| DB | Firestore |
| Functions | Cloud Functions Gen 2 |
| Hosting | Firebase Hosting |
| CI/CD | GitHub Actions |
| Monitoring | Sentry + Cloud Logging |
| Secretes | GitHub Secrets + `admin-config/llm-secret` |

## Fluxo de dados

### 1. Login (Magic Link)

```
1. Usuário digita email
2. Frontend: signInWithEmailLink(email)
3. Firebase envia email com link
4. Usuário clica no link → redireciona para /login?email=...
5. Frontend: signInWithEmailLink(email, link)
6. Trigger: onUserCreated
   - Cria users/{uid} doc
   - Cria admins/{uid} se for o primeiro
   - Envia email de boas-vindas
7. Frontend: redireciona para /onboarding (se !onboardingComplete) ou /dashboard
```

### 2. Chat com agente

```
1. Usuário digita mensagem
2. Frontend: sendMessage({ message, conversaId, agente })
3. Cloud Function: api (/chat/message)
4. Orquestrador:
   a. Detecta agente (router) se for 'auto'
   b. Anonimiza PII
   c. RAG: recupera 5 chunks relevantes (vector search)
   d. Carrega config do agente (admin)
   e. Resolve LLM config efetivo (4-level hierarchy)
   f. Carrega system prompt + skills
   g. Carrega contexto do usuário (peso, lesões, último treino)
   h. Carrega histórico (últimas 10 mensagens)
   i. Chama LLM
   j. Salva mensagens (user + assistant)
5. Retorna resposta + sources + metadata
6. Frontend: renderiza com badges de agente e latência
```

### 3. Upload de corpus (admin)

```
1. Admin faz upload de PDF
2. Cloud Function: adminUploadDocument (signed URL)
3. Storage: salva em /corpus/raw/{uuid}.pdf
4. Trigger: onCorpusDocumentCreated
5. Pipeline de ingestão:
   a. Extrai texto (pdf-parse)
   b. Divide em chunks (1500 chars, overlap 200)
   c. Gera embeddings (Gemini text-embedding-004)
   d. Salva corpus/studies/studies/{id}
   e. Salva chunks com embeddings
6. Corpus fica disponível para RAG
```

### 4. Treino registrado

```
1. Usuário preenche form de treino
2. Frontend: criarRegistro('treinos', data)
3. Cloud Function: api (/registros/treinos)
4. Cria users/{uid}/treinos/{treinoId}
5. Trigger: onTreinoCreated (opcional)
   - Atualiza métricas
   - Envia para análise
6. Frontend: invalida query treinos
```

## Estrutura de pastas

```
toppkb/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn primitives
│   │   │   ├── layout/       # Sidebar, Topbar
│   │   │   ├── common/       # ConfirmDialog, EmptyState
│   │   │   ├── dashboard/    # Charts, StatCard
│   │   │   ├── chat/         # ChatMessage
│   │   │   └── registros/    # Formulários específicos
│   │   ├── pages/
│   │   │   ├── admin/        # AdminLayout, AdminCorpus, etc
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   ├── Treinos.tsx
│   │   │   └── ...           # 32+ pages
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useRegistros.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── useMediaQuery.ts
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   ├── uiStore.ts
│   │   │   └── chatStore.ts
│   │   ├── lib/
│   │   │   ├── firebase.ts
│   │   │   ├── api.ts
│   │   │   ├── chat-api.ts
│   │   │   ├── llm-api.ts
│   │   │   └── utils.ts
│   │   └── App.tsx
│   └── package.json
├── functions/
│   ├── src/
│   │   ├── index.ts          # exports
│   │   ├── handlers/
│   │   │   ├── auth.ts       # onUserCreated, onUserConsent
│   │   │   ├── api.ts        # REST endpoints
│   │   │   ├── scheduled.ts  # cleanup, weeklySummary
│   │   │   ├── llm-config.ts # getLLMConfig, etc
│   │   │   ├── agents-config.ts
│   │   │   ├── admin-documents.ts
│   │   │   ├── admin-stats.ts
│   │   │   ├── profile.ts
│   │   │   ├── history.ts
│   │   │   ├── feedback.ts
│   │   │   ├── delete-account.ts
│   │   │   └── bootstrap-admin.ts
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── orquestrador.ts
│   │   │   │   └── router.ts
│   │   │   ├── embeddings.ts
│   │   │   ├── retrieval.ts
│   │   │   ├── history.ts
│   │   │   ├── profile.ts
│   │   │   ├── analytics.ts
│   │   │   ├── anonymizer.ts
│   │   │   ├── chunking.ts
│   │   │   ├── llm-providers.ts
│   │   │   ├── llm-config.ts
│   │   │   ├── agents-config.ts
│   │   │   ├── global-llm.ts
│   │   │   ├── config-store.ts
│   │   │   ├── firestore.ts
│   │   │   └── sentry.ts
│   │   ├── agents/
│   │   │   ├── types.ts
│   │   │   └── runner.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── consent.ts
│   │   │   └── ratelimit.ts
│   │   ├── prompts/
│   │   │   ├── base.ts
│   │   │   ├── treinador.ts
│   │   │   ├── preparador.ts
│   │   │   ├── nutricionista.ts
│   │   │   ├── estrategista.ts
│   │   │   ├── general.ts
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── feature-flags.ts
│   │   └── utils/
│   │       ├── math.ts
│   │       └── chunking.ts
│   └── package.json
├── data/raw/
│   ├── sources.json
│   ├── tecnica-3rd-shot.md
│   ├── preparacao-50mais.md
│   └── nutricao-jogador.md
├── scripts/
│   ├── ingest-pdf.ts
│   ├── seed-user.ts
│   ├── validate-corpus.ts
│   └── reindex-corpus.ts
├── docs/
│   ├── 00-12*.md
│   └── adr/0001-0009*.md
├── .github/workflows/
│   ├── ci.yml
│   ├── lint.yml
│   ├── deploy-develop.yml
│   ├── deploy-prod.yml
│   ├── validate-corpus.yml
│   └── codeql.yml
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── firebase.json
├── .firebaserc
├── .prettierrc.json
└── .editorconfig
```

## Segurança

### Defesa em profundidade

1. **Firebase Auth**: Magic Link (passwordless), sem senhas vazadas
2. **Firestore Rules**: validação de `request.auth.uid` em todas as coleções
3. **App Check**: valida que requisições vêm do app legítimo (reCAPTCHA)
4. **API Secrets**: apiKey LLM em `admin-config/llm-secret` (master-only)
5. **PII Filter**: anonymizer antes de enviar ao LLM
6. **Rate Limiting**: middleware verifica quota por user
7. **Audit Log**: ações sensíveis registradas
8. **HTTPS only**: TLS 1.3, HSTS

### Threat model

- **Ataque**: outro user tenta ler dados de outro
  - **Mitigação**: `isOwner(uid)` em todas as rules
- **Ataque**: vazamento de apiKey via frontend
  - **Mitigação**: key nunca retornada, apenas `keyMasked`
- **Ataque**: prompt injection no chat
  - **Mitigação**: PII filter + system prompt + auditoria
- **Ataque**: DDoS
  - **Mitigação**: rate limit + App Check + Cloud Armor (se necessário)

## Performance

### Metas

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **API response**: < 200ms (p95)
- **Vector search**: < 100ms (p95)
- **LLM first token**: < 1s

### Otimizações

- **Frontend**: Vite (code splitting), PWA (cache), lazy loading de rotas
- **Backend**: Cloud Functions warm pool, Firestore indexes
- **RAG**: cache de embeddings, top-K=5, threshold=0.5
- **LLM**: streaming (SSE), max_tokens razoável (1500 default)

## Escalabilidade

### Limites atuais (Fase 1)

- **Usuários**: até 100 (uso pessoal + família)
- **Corpus**: até 10k chunks
- **Mensagens/dia**: até 1k
- **Treinos/registros**: até 100k

### Quando crescer

- **10k+ usuários**: considerar Blaze plan, monitoring completo
- **100k+ chunks**: migrar para Vertex AI Matching Engine
- **1M+ mensagens/dia**: considerar BigQuery para analytics
