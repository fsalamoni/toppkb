# 🧪 Testes — Top Pickleball 50+

> Estratégia de testes do projeto.

---

## 1. Pirâmide de testes

```
        /\
       /  \        E2E (Playwright) — 5% — fluxos críticos
      /────\
     /      \      Integração (Vitest) — 20% — endpoints + rules
    /────────\
   /          \    Unit (Vitest) — 75% — funções puras, router IA, schemas
  /────────────\
```

---

## 2. Unit Tests (Vitest)

### 2.1 Onde ficam
- `frontend/src/**/*.test.ts`
- `functions/src/**/*.test.ts`

### 2.2 O que testar

**Frontend:**
- Hooks (`useRegistros`, `useMetricas`, `useAgente`)
- Componentes puros (formatters, validators)
- Funções de detecção de agente
- Schemas Zod

**Backend:**
- Router de agente (detecção de tema)
- Validação Zod de payloads
- Funções de agregação (métricas)
- Cálculo de IMC, déficit calórico, etc
- Helpers de formatação

### 2.3 Como rodar
```bash
cd frontend && npm test
cd functions && npm test
```

### 2.4 Exemplo
```ts
// functions/src/services/ai/router.test.ts
import { describe, it, expect } from 'vitest';
import { detectarAgente } from './router';

describe('detectarAgente', () => {
  it('detecta Treinador em pergunta sobre dink', () => {
    expect(detectarAgente('Como melhorar meu dink?')).toBe('treinador');
  });

  it('detecta Preparador em menção a joelho', () => {
    expect(detectarAgente('Tô com dor no joelho')).toBe('preparador');
  });

  it('detecta Nutricionista em pergunta sobre whey', () => {
    expect(detectarAgente('Posso tomar whey à noite?')).toBe('nutricionista');
  });

  it('retorna general para pergunta vazia', () => {
    expect(detectarAgente('Oi, tudo bem?')).toBe('general');
  });
});
```

---

## 3. Testes de integração (Firestore Rules)

### 3.1 Framework
`@firebase/rules-unit-testing` — emula Firestore e roda assertions nas rules.

### 3.2 Exemplo
```ts
// functions/src/rules/treinos.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';

let env;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-toppkb',
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

it('permite user ler seus próprios treinos', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc('users/user1/treinos/treino1').set({ data: '...' });
  });

  const ctx = env.authenticatedContext('user1');
  const treino = ctx.firestore().doc('users/user1/treinos/treino1');
  await assertSucceeds(treino.get());
});

it('NÃO permite user2 ler treinos de user1', async () => {
  const ctx = env.authenticatedContext('user2');
  const treino = ctx.firestore().doc('users/user1/treinos/treino1');
  await assertFails(treino.get());
});
```

---

## 4. Testes E2E (Playwright) — fase 2

### 4.1 Cenários críticos
- Login com magic link
- Onboarding completo
- Registrar treino + ver no dashboard
- Chat com IA (auto-detecção de agente)
- Exportar dados

### 4.2 Estrutura
```
e2e/
├── fixtures/
│   └── auth.ts          # login helper
├── tests/
│   ├── auth.spec.ts
│   ├── treinos.spec.ts
│   ├── chat.spec.ts
│   └── exportar.spec.ts
└── playwright.config.ts
```

---

## 5. Cobertura de código

**Meta MVP:** 70% de cobertura em `functions/`, 50% em `frontend/`.

```bash
cd functions && npm run test:coverage
cd frontend && npm run test:coverage
```

---

## 6. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

---

## 7. Próximo

[`09-MONITORAMENTO.md`](./09-MONITORAMENTO.md) — observabilidade.
