# 📊 Monitoramento — Top Pickleball 50+

> Como observamos o app em produção.

---

## 1. Stack de observabilidade

| Camada | Ferramenta | Para quê |
|---|---|---|
| Erros | Sentry | Erros JS no front e back |
| Logs | Cloud Logging | Logs de Cloud Functions |
| Performance | Sentry + Web Vitals | Latência de requests e UI |
| Negócio | Firebase Analytics | Eventos custom (registros, chat, etc) |
| Custo | GCP Billing | Custo mensal |
| Uptime | Firebase Console | Hosting + Functions status |

---

## 2. Sentry

### 2.1 Setup

- **Projeto:** `top-pickleball-50` (criar em sentry.io)
- **DSN:** variável `SENTRY_DSN` no `.env`
- **Traces sample rate:** 0.1 (10% das transações)
- **Release:** vinculado ao commit SHA

### 2.2 Eventos customizados

```ts
Sentry.captureMessage('user.login.magic_link', {
  level: 'info',
  tags: { ambiente: 'prod' },
  user: { id: uid, email },
});

Sentry.addBreadcrumb({
  category: 'chat',
  message: 'Agente detectado',
  data: { agente: 'treinador', confianca: 0.85 },
});
```

### 2.3 Alertas
- Erro 500 em função > 5 ocorrências em 5 min → e-mail
- Latência p95 > 10s → Slack
- Release com error rate > baseline + 20% → e-mail

---

## 3. Cloud Logging

### 3.1 Structured logging
```ts
functions.logger.info('chat.message', {
  uid,
  agente: 'treinador',
  tokens: 450,
  latenciaMs: 2300,
  structuredData: true,
});
```

### 3.2 Ver logs
```bash
firebase functions:log --only api -n 100
firebase functions:log --only api --severity ERROR
```

---

## 4. Web Vitals (frontend)

Métricas capturadas automaticamente via `web-vitals`:

- **LCP** (Largest Contentful Paint) — meta < 2.5s
- **FID** (First Input Delay) — meta < 100ms
- **CLS** (Cumulative Layout Shift) — meta < 0.1
- **FCP** (First Contentful Paint) — meta < 1.8s
- **TTFB** (Time to First Byte) — meta < 800ms

---

## 5. Firebase Analytics

### 5.1 Eventos customizados

| Evento | Quando dispara | Parâmetros |
|---|---|---|
| `login_magic_link` | Login com sucesso | método |
| `onboarding_complete` | Onboarding finalizado | duracao |
| `registro_criado` | Novo registro salvo | tipo, duracao |
| `chat_message_sent` | Msg enviada à IA | agente, tokens |
| `avaliacao_mensal` | Avaliação mensal preenchida | mes |
| `torneio_inscrito` | Inscrição em torneio | torneio_id |

### 5.2 Conversões-chave
- DAU/MAU
- Retenção D1, D7, D30
- Tempo médio de sessão
- Mensagens de chat por usuário
- Taxa de preenchimento da avaliação mensal

---

## 6. Alertas

| Alerta | Threshold | Canal |
|---|---|---|
| Error rate | > 5% por 5 min | Sentry + e-mail |
| Latência p95 | > 10s | Sentry + Slack |
| Custo GCP | > $20/mês | E-mail |
| Functions timeout | > 3 ocorrências | E-mail |
| Cold start | > 10s | Log only |
| Quota Firestore | > 80% do plano | E-mail |

---

## 7. Dashboard

**Sentry Issues:** https://sentry.io/organizations/top-pickleball/issues/

**GCP Console:** https://console.cloud.google.com/home/dashboard?project=toppkb

**Firebase Console:** https://console.firebase.google.com/project/toppkb/overview

---

## 8. Próximo

[`10-ROADMAP-PRODUTO.md`](./10-ROADMAP-PRODUTO.md) — features futuras.
