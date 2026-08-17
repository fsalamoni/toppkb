# 🛠️ Operação — Top Pickleball 50+

> Como operar e monitorar o app em produção.

---

## 1. URLs importantes

| Recurso | URL |
|---|---|
| App (produção) | https://toppkb.web.app |
| App (preview channel) | https://toppkb--pr-{N}.web.app |
| Firebase Console | https://console.firebase.google.com/project/toppkb |
| Cloud Functions logs | https://console.cloud.google.com/functions/list?project=toppkb |
| Firestore Data | https://console.firebase.google.com/project/toppkb/firestore |
| Sentry | https://sentry.io/organizations/top-pickleball/issues/ |

---

## 2. Monitoramento

### 2.1 Sentry (erros)

- Captura erros de front e backend
- Alertas por e-mail quando error spike
- Filtros: ambiente, release, user

### 2.2 Cloud Logging (Firebase)

```bash
# Logs em tempo real
firebase functions:log --only api

# Filtrar por severidade
firebase functions:log --only api --severity ERROR

# Últimas 50 linhas
firebase functions:log --only api -n 50
```

### 2.3 Firestore usage

Firebase Console → Firestore → Usage:
- Reads/dia
- Writes/dia
- Deletes/dia
- Storage

### 2.4 Alertas configurados

| Alerta | Threshold | Canal |
|---|---|---|
| Error rate > 5% | 5min | E-mail + Slack |
| Função com timeout | 1 ocorrência | E-mail |
| Custo > $20/mês | mensal | E-mail |
| Usuário deletou conta | imediato | Audit log |

---

## 3. Backup

### 3.1 Firestore (automático via GCS)

```bash
# Configurar export diário
gcloud firestore export gs://toppkb-backups/$(date +%Y%m%d) \
  --project=toppkb
```

Agendar via Cloud Scheduler → Cloud Function.

### 3.2 Retenção
- Backups diários: 30 dias
- Backups semanais: 12 meses
- Backups mensais: 5 anos

---

## 4. Incidentes comuns

### 4.1 LLM retorna 429 (rate limit)

**Sintoma:** chat retorna erro "rate limited".
**Causa:** o provider configurado está sob rate limit (cada provider tem políticas diferentes).
**Solução:**
1. Curto prazo: orientar usuário a esperar 1 min.
2. Longo prazo: fazer upgrade do plano no provider, ou trocar para outro provider (17 opções disponíveis).

### 4.2 Cold start das functions

**Sintoma:** 1ª chamada do dia demora 5-10s.
**Causa:** Cloud Functions Gen 2 hiberna após 15min sem uso.
**Solução:** configurar `minInstances: 1` no Blaze (custo ~$0.40/mês por instância).

### 4.3 Permission denied nas rules

**Sintoma:** usuário não consegue ler/escrever.
**Diagnóstico:**
```bash
# Simular request
firebase emulators:start --only firestore
# No painel UI: use o "Rules Playground"
```
**Causas comuns:**
- Consent não aceito
- Tentar ler doc de outro user
- `request.resource.data` tem campo extra não permitido em `isValidUserUpdate()`

### 4.4 Quota exceeded

**Sintoma:** erro `RESOURCE_EXHAUSTED` no Firestore.
**Solução:** fazer upgrade para plano Blaze ou otimizar queries (cache client-side com TanStack Query).

---

## 5. Tarefas recorrentes

### 5.1 Diárias (automatizadas)
- 03:00 — Limpeza de registros > 5 anos
- 06:00 — Verificar dor aguda (>= 7/10 nas últimas 24h)
- 20:00 (domingo) — Gerar resumo semanal

### 5.2 Semanais (manuais)
- Segunda: revisar logs de erro do Sentry
- Quarta: verificar uso de quota no Firebase Console
- Sexta: verificar Sentry release health

### 5.3 Mensais (manuais)
- Dia 1: revisar custos GCP
- Dia 15: revisar e arquivar feedbacks negativos
- Dia 30: avaliação do app (NPS, métricas de uso)

---

## 6. Métricas de saúde do app

| Métrica | Meta | Como medir |
|---|---|---|
| DAU/MAU | > 50% | Firebase Analytics |
| Retenção D7 | > 70% | Firebase Analytics |
| Retenção D30 | > 40% | Firebase Analytics |
| Tempo médio de sessão | 5-10 min | Firebase Analytics |
| Taxa de erro | < 1% | Sentry |
| Latência p95 do chat | < 5s | Sentry + Cloud Monitoring |
| NPS | > 50 | Survey in-app |

---

## 7. Contatos de emergência

- **Firebase Support:** https://firebase.google.com/support
- **Google Cloud Support:** https://cloud.google.com/support
- **Suporte do provider LLM escolhido** (cada um tem a sua documentação)
- **Sentry Support:** https://sentry.io/support/

---

## 8. Próximo

[`05-LGPD-SEGURANCA.md`](./05-LGPD-SEGURANCA.md) — compliance e segurança.
