# ADR 0009 — Estratégia de Deploy

## Status

Aceito (2025-01-15)

## Contexto

Aplicação pessoal de alto risco (decisões sobre saúde, performance). Precisamos de:
- Zero-downtime deploy
- Rollback rápido
- Ambientes separados (dev/prod)
- CI/CD robusto

## Decisão

### Ambientes

- **Production**: `toppkb-prod` (Firebase project)
  - Branch: `main`
  - Deploy: manual via GitHub Actions
  - Smoke test obrigatório após deploy
- **Develop**: `toppkb-dev` (Firebase project)
  - Branch: `develop`
  - Deploy: automático em push

### Pipeline

```
PR → lint.yml (ESLint + TypeCheck + tests)
  ↓
merge to develop → deploy-develop.yml
  ↓
merge to main → deploy-prod.yml (manual)
```

### Cloud Functions

- **Linguagem**: Node 20
- **Região**: southamerica-east1 (São Paulo)
- **Memória**: 256MB-512MB (default)
- **Timeout**: 60s (callables), 540s (scheduled)
- **Min instances**: 0 (frio OK em uso pessoal)
- **Max instances**: 10

### Hosting (Frontend)

- **Build**: Vite (dist/)
- **CDN**: Firebase Hosting
- **Cache**: 1 ano para assets hashed, 0 para index.html
- **Rewrites**: `/api/**` → Cloud Function `api`
- **Headers**: CSP, X-Frame-Options, etc

### Rollback

- **Functions**: `firebase functions:rollback` (mantém últimas 10 versões)
- **Hosting**: `firebase hosting:clone` (mantém últimos 30 deploys)
- **Rules**: re-deploy da versão anterior via Git revert

### Smoke test pós-deploy

```yaml
- name: Smoke test
  run: |
    curl -sf $PROD_URL > /dev/null
    curl -sf $PROD_URL/api/health
    curl -sf $PROD_FN/getMe -X POST -H "Content-Type: application/json" -d '{}'
```

## Consequências

**Positivas:**
- Separação clara dev/prod
- Rollback trivial
- Deploy em < 5min total

**Negativas:**
- Custo de manter 2 Firebase projects (~$5-10/mês cada)
- Deploy manual em prod (risco de esquecimento)

## Quando mudar

Se começar a ter múltiplos desenvolvedores, considerar:
- Feature flags (LaunchDarkly ou custom)
- Preview environments por PR (Vercel-style)
- Blue-green deploy
