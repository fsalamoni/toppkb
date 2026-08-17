# 🏓 Top Pickleball 50+ — Frontend

> React 18 + Vite + TypeScript + Tailwind + shadcn-style

## Stack

- React 18.3
- Vite 5
- TypeScript 5.5
- Tailwind CSS 3.4
- Radix UI (componentes primitivos)
- Zustand (estado)
- TanStack Query (server state)
- React Router 6
- React Hook Form + Zod
- Firebase SDK 10
- Recharts (gráficos)
- Lucide React (ícones)
- i18next (PT-BR)

## Estrutura

```
src/
├── components/
│   ├── ui/         # primitivos (Button, Card, Input, etc)
│   ├── layout/     # AppShell
│   ├── common/     # Loading, EmptyState, Toaster
│   ├── registros/  # (futuro: formulários específicos)
│   ├── dashboard/  # (futuro: widgets)
│   └── chat/       # (futuro: chat widget)
├── pages/          # 32 rotas
├── hooks/          # useAuth, useRegistros
├── stores/         # Zustand
├── lib/            # firebase, api, utils, schemas
├── i18n/           # PT-BR
├── types/
└── App.tsx
```

## Rotas principais

| Rota | Descrição |
|---|---|
| `/login` | Magic link |
| `/consent` | Termo LGPD |
| `/onboarding` | 5 perguntas iniciais |
| `/` | Dashboard com KPIs |
| `/treinos`, `/partidas`, `/estudos` | Pickleball |
| `/fisico/fisio`, `/forca`, `/mobilidade`, `/cardio` | Preparação física |
| `/alimentacao/refeicoes`, `/agua`, `/suplementos` | Nutrição |
| `/saude/peso`, `/medidas`, `/sono`, `/dores` | Saúde |
| `/torneios` | Calendário competitivo |
| `/metricas`, `/metricas/avaliacoes/nova`, `/metricas/metas` | Métricas |
| `/chat`, `/chat/:conversaId` | Chat com 5 agentes IA |
| `/configuracoes`, `/configuracoes/perfil` | Configurações |

## Comandos

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha. Veja [docs/01-INSTALACAO.md](../docs/01-INSTALACAO.md).
