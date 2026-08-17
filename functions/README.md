# ☁️ Top Pickleball 50+ — Cloud Functions

> Backend Node 20 + TypeScript + Cloud Functions Gen 2 + Gemini 2.5

## Estrutura

```
src/
├── index.ts                     # exports
├── handlers/
│   ├── auth.ts                  # onCreate/onDelete user
│   ├── api.ts                   # router /api/**
│   └── scheduled.ts             # cron jobs
├── services/
│   ├── ai/
│   │   ├── gemini.ts            # cliente Gemini
│   │   ├── router.ts            # detecção de agente
│   │   ├── orquestrador.ts      # combina contexto + Gemini
│   │   ├── router.test.ts       # testes
│   ├── sentry.ts                # error tracking
├── middleware/
│   ├── auth.ts                  # valida ID token
│   ├── consent.ts               # exige consent aceito
│   └── ratelimit.ts             # in-memory
├── prompts/
│   ├── base.ts
│   ├── treinador.ts
│   ├── preparador.ts
│   ├── nutricionista.ts
│   ├── estrategista.ts
│   ├── general.ts
│   └── index.ts
├── config/
│   ├── env.ts                   # admin SDK, logger
│   └── feature-flags.ts
└── utils/
    ├── math.ts
    └── math.test.ts
```

## Comandos

```bash
npm install
npm run build
npm run serve         # emuladores
npm run deploy        # production
npm test
```

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/auth/send-link` | Stub (frontend usa SDK direto) |
| GET | `/user/me` | Retorna user |
| PATCH | `/user/me` | Atualiza user |
| POST | `/user/accept-consent` | Registra consent |
| POST/GET/PUT/DELETE | `/registros/:colecao[/:id]` | CRUD genérico (17 coleções) |
| POST | `/chat/message` | Envia msg à IA (5 agentes) |
| GET | `/chat/conversas` | Lista conversas |
| GET | `/chat/conversas/:id/messages` | Mensagens da conversa |
| GET | `/metricas/dashboard` | KPIs do dashboard |
| GET | `/exportar/tudo` | LGPD — exporta tudo |
| DELETE | `/deletar-conta` | LGPD — remove conta |

## 5 Agentes de IA

| Persona | Tema | System prompt |
|---|---|---|
| 🏓 Coach Bruno | Treinador (técnica/tática) | `prompts/treinador.ts` |
| 💪 Prof. Marcos | Preparador físico | `prompts/preparador.ts` |
| 🥗 Dra. Ana | Nutricionista | `prompts/nutricionista.ts` |
| 🧠 Coach Carla | Estrategista | `prompts/estrategista.ts` |
| 🤖 Assistente Geral | Suporte | `prompts/general.ts` |

Detecção automática via keywords (ver `services/ai/router.ts`).

## Scheduled Jobs

| Job | Cron | Função |
|---|---|---|
| Limpeza | `0 3 * * *` | Remove registros > 5 anos |
| Resumo semanal | `0 20 * * 0` | Gera resumo semanal com IA |
| Verificar dor | `0 */6 * * *` | Marca dor >= 7 como alerta |

## Variáveis de ambiente

Veja `.env.example`. Configurar em:
- Dev local: `.env` ou `firebase functions:config:set`
- Produção: `firebase functions:secrets:set`
