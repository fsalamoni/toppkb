# ADR 0001 — Stack tecnológico (React + Vite + TS + Tailwind + Firebase)

**Data:** 2026-08-17
**Status:** Aceito

## Contexto

Precisamos de uma stack moderna, produtiva, com boa DX e que permita entregar um MVP em 6-8 semanas. O projeto Cofrito (paralelo) já validou o stack que vamos usar.

## Decisão

Adotamos o mesmo stack do Cofrito:

| Camada | Tecnologia | Por quê |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Performance, ecossistema, maturidade |
| Estilo | Tailwind CSS 3.4 | Produtividade, consistência |
| UI | shadcn-style (Radix UI) | Acessibilidade, sem lock-in |
| Estado | Zustand | Leve, simples |
| Server state | TanStack Query | Cache, retries, devtools |
| Roteamento | React Router 6 | Padrão da comunidade |
| Forms | React Hook Form + Zod | Performance, validação tipada |
| Auth | Firebase Auth | Magic link, sem backend |
| DB | Firestore | Realtime, rules poderosas |
| Backend | Cloud Functions Gen 2 | Serverless, escalável |
| IA | 17 provedores (Google AI, OpenAI, Anthropic, etc) | provider-agnostic, sem default |
| CI/CD | GitHub Actions | Integração nativa |
| Hosting | Firebase Hosting | CDN global, HTTPS grátis |

## Consequências

### Positivas
- **Time-to-market:** 6-8 semanas para MVP
- **Custo:** < $5/mês com 1 usuário
- **Conhecimento reaproveitado** do projeto Cofrito
- **Comunidade ativa** em todas as tecnologias
- **Padrão da indústria** — fácil contratar devs no futuro

### Negativas
- **Vendor lock-in** com Firebase/GCP
- **Cold start** das Cloud Functions (3-10s)
- **Limites do plano Spark** (20k reads/dia)
- **Sem TypeScript end-to-end** no client (Firebase SDK tem tipos parciais)

### Mitigações
- Backup diário via GCS (mitiga lock-in de dados)
- Plano Blaze quando necessário (mitiga cold start + limites)
- Wrapper próprio sobre Firebase SDK (mitiga tipagem)
