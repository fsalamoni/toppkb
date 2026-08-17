# 🏓 Top Pickleball 50+

> **Plataforma pessoal de gestão esportiva para o atleta que quer ser o melhor jogador 50+ do Brasil em 2032.**

App full-stack construído com a mesma stack do projeto [Cofrito](https://github.com/fsalamoni/cofrito):
**React 18 + Vite + TypeScript + Tailwind + Firebase (Auth Magic Link + Firestore + Cloud Functions) + Gemini AI**.

---

## 🎯 Objetivo

Apoiar o atleta (44 anos, 95kg, joelho D + ombro E, 15h/sem) em 6 anos de jornada rumo à categoria 50+ de elite, com:

- 📊 **Registros** de treinos, partidas, fisio, nutrição, peso, dores, sono
- 🤖 **IA com 5 agentes especializados** (Treinador, Preparador, Nutricionista, Estrategista, General)
- 📈 **Métricas e dashboard** com KPIs em tempo real
- 🏆 **Calendário de torneios** e roadmap competitivo
- 🎯 **Metas SMART** e avaliações mensais
- 🔒 **LGPD total** — dados 100% isolados por usuário

---

## 🏗️ Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind + shadcn-style + Zustand + React Query |
| Auth | Firebase Auth (Magic Link) |
| Banco | Firestore (isolamento total por user via Rules) |
| Backend | Cloud Functions Node 20 + TypeScript |
| IA | Gemini 2.5 Flash (default) + Pro (longo) |
| Embeddings | Gemini text-embedding-004 |
| Email | Resend |
| Hosting | Firebase Hosting |
| CI/CD | GitHub Actions |
| Observabilidade | Sentry + Cloud Logging |

---

## 📚 Documentação

A documentação completa está em `docs/`:

| Doc | Conteúdo |
|---|---|
| [00-PLANEJAMENTO-COMPLETO.md](docs/00-PLANEJAMENTO-COMPLETO.md) | Visão geral — começar por aqui |
| [01-INSTALACAO.md](docs/01-INSTALACAO.md) | Setup de ambiente dev |
| [02-ARQUITETURA.md](docs/02-ARQUITETURA.md) | Arquitetura técnica detalhada |
| [03-DEPLOY.md](docs/03-DEPLOY.md) | Como fazer deploy |
| [04-OPERACAO.md](docs/04-OPERACAO.md) | Operação e monitoramento |
| [05-LGPD-SEGURANCA.md](docs/05-LGPD-SEGURANCA.md) | LGPD, segurança, compliance |
| [06-API-REFERENCE.md](docs/06-API-REFERENCE.md) | Contratos das Cloud Functions |
| [07-AGENTES-PROMPTS.md](docs/07-AGENTES-PROMPTS.md) | System prompts dos 5 agentes IA |
| [08-TESTES.md](docs/08-TESTES.md) | Estratégia de testes |
| [09-MONITORAMENTO.md](docs/09-MONITORAMENTO.md) | Observabilidade |
| [10-ROADMAP-PRODUTO.md](docs/10-ROADMAP-PRODUTO.md) | Roadmap de features |
| [11-PERFIL-ATLETA.md](docs/11-PERFIL-ATLETA.md) | Perfil e objetivo do atleta |

ADRs (Architecture Decision Records) em `docs/adr/`.

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/fsalamoni/toppkb.git
cd toppkb

# 2. Instale dependências
cd frontend && npm install
cd ../functions && npm install

# 3. Configure ambiente
cp .env.example .env.local
# preencha GEMINI_API_KEY e credenciais Firebase

# 4. Emuladores locais
cd functions && npm run serve   # Firestore + Auth + Functions emulators

# 5. Frontend dev
cd ../frontend && npm run dev
# abra http://localhost:5173
```

---

## 📊 Status

- ✅ **Estrutura completa** (frontend + backend + rules + docs)
- ✅ **Schema Firestore** com 19 coleções isoladas por user
- ✅ **5 agentes de IA** com system prompts prontos
- ✅ **Roadmap MVP** 6-8 semanas
- 🚧 **Implementação em andamento** (Sprint 0 → Sprint 7)

---

## 🏆 A meta

> Em 2032, quando o atleta tiver 50 anos e estiver jogando o Brasileirão 50+,
> este app vai ser o diário de bordo de toda a jornada.

---

**Versão:** 0.1.0
**Owner:** Atleta (você 🏓)
**Assistente:** Mavis
**Última atualização:** 2026-08-17
