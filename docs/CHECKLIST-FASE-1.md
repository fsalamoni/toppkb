# Checklist — Fase 1 (MVP)

Estrutura clonada do Cofrito. Antes de ir para produção, valide cada item.

## Estrutura

- [x] Estrutura de pastas (frontend + functions + docs + data + scripts)
- [x] `firestore.rules` com isolamento total por usuário
- [x] `firestore.indexes.json` com índices compostos
- [x] `firebase.json` com rewrites e hosting
- [x] `.firebaserc` configurado
- [x] `.env.example` documentado

## Autenticação

- [x] Firebase Magic Link (passwordless)
- [x] `onUserCreated` cria user doc com perfil
- [x] `onUserConsent` registra consentimento LGPD
- [x] `onUserDeleted` limpa dados (subcoleções)
- [x] Primeiro user vira admin master

## LLM Multi-Provider (4 níveis)

- [x] 17 providers suportados (Gemini, OpenAI, Anthropic, etc)
- [x] Hierarquia: Agent custom → User → Global → env
- [x] apiKey segura (admin-config/llm-secret)
- [x] `getLLMConfig`, `setLLMConfig`, `deleteLLMConfig`
- [x] `adminGetGlobalLLM`, `adminSetGlobalLLM`
- [x] `listLLMModels` (lista modelos por provider)
- [x] `adminListAdmins`, `adminGrantAdmin`, `adminRevokeAdmin`
- [x] `adminListUserLLM` (master vê configs dos users)

## Agentes (5)

- [x] Treinador (técnica, tática, fundamentos)
- [x] Preparador (físico, lesão, periodização)
- [x] Nutricionista (dieta, suplementação, composição)
- [x] Estrategista (metas, torneios, calendário)
- [x] General (orientação no app)
- [x] Skills customizáveis pelo admin
- [x] Router automático por keywords

## Orquestrador

- [x] Detecção de agente (auto)
- [x] Anonimização de PII antes de enviar ao LLM
- [x] RAG (Firestore Vector Search)
- [x] System prompt por agente + skills
- [x] Contexto do usuário (peso, lesões, último treino)
- [x] Histórico de conversa

## Frontend

- [x] React 18 + Vite + TypeScript + Tailwind
- [x] PWA (vite-plugin-pwa)
- [x] React Router + React Query
- [x] Zustand (auth, ui, chat)
- [x] 32+ páginas (Login, Dashboard, Chat, Treinos, etc)
- [x] Componentes UI (Button, Card, Input, Dialog, Tabs, Select, etc)
- [x] Dashboard com Recharts (Line, Area, Bar, Pie)
- [x] Chat com orchestrator timeline
- [x] Admin pages (Corpus, LLM, Agents, Users, Stats)

## Backend

- [x] Express API (REST) em `/api/**`
- [x] Callable handlers (alternativa)
- [x] Middleware (auth, consent, ratelimit)
- [x] Embeddings service (Gemini text-embedding-004)
- [x] Retrieval service (Firestore Vector Search + cosine)
- [x] History service (conversas, mensagens)
- [x] Profile service (perfil, preferências)
- [x] Analytics service (métricas, agregados)
- [x] Anonymizer (PII filter)
- [x] Config-store (audit envelope)
- [x] Global LLM (admin-config/llm-secret)
- [x] Agents config (admin-config/agents)
- [x] Scheduled jobs (cleanup, weeklySummary, painCheck, aggregate)
- [x] Delete account (LGPD)
- [x] Exportar tudo (LGPD)
- [x] Audit log

## Segurança (LGPD)

- [x] Consentimento explícito
- [x] Isolamento total por usuário (Firestore Rules)
- [x] apiKey nunca exposta (sempre mascarada)
- [x] Admin master auto-grant
- [x] Delete account remove tudo
- [x] Exportar tudo (LGPD Art. 18)
- [x] PII filter antes de LLM
- [x] Audit log de ações sensíveis

## CI / CD

- [x] `lint.yml` — ESLint + TypeCheck
- [x] `ci.yml` — build + test
- [x] `deploy-develop.yml` — auto deploy em develop
- [x] `deploy-prod.yml` — manual deploy em main
- [x] `validate-corpus.yml` — check corpus
- [x] `codeql.yml` — security scan
- [x] `.prettierrc.json` + `.editorconfig`

## Documentação

- [x] 11 docs (00-11) + 6 ADRs
- [x] SETUP-COMPLETO.md
- [x] CHECKLIST-FASE-1.md
- [x] FAQ-INSTITUCIONAL.md
- [x] Diagrama de arquitetura (docs/02-ARQUITETURA.md)

## Pendências para Fase 2

- [ ] Realizar deep search com embeddings
- [ ] A11y WCAG 2.2 (auditoria)
- [ ] E2E tests (Playwright)
- [ ] Notificações push
- [ ] Integração com torneios (CBPK)
- [ ] Mobile app (React Native?)
- [ ] Backup automático do Firestore
