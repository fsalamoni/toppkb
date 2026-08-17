# 🚀 Deploy — Top Pickleball 50+

> Como colocar o app em produção.

---

## 1. Setup inicial (uma vez)

### 1.1 Criar projeto Firebase de produção

1. Firebase Console → Add project → `toppkb` (não `toppkb-dev`)
2. Ativar: Auth (Magic Link), Firestore, Functions (Blaze), Hosting, Storage
3. Em `.firebaserc`, já está configurado:
   ```json
   "prod": "toppkb"
   ```

### 1.2 Conectar billing

Cloud Functions Gen 2 exige plano Blaze (pay-as-you-go). O custo estimado é:

- 1M invocações/mês grátis
- 400k GB-segundo/mês grátis
- Gemini: ~$0.075/1M tokens Flash

**Estimativa 1 usuário ativo:** < $5/mês.

---

## 2. Secrets no GitHub

Adicione em **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Valor |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_TOPPKB` | JSON do service account (base64) |
| `GEMINI_API_KEY` | Sua API key do Google AI Studio |
| `PUBLIC_URL` | `https://toppkb.web.app` |
| `FIREBASE_PROJECT_ID` | `toppkb` |

### Como gerar o service account:
```bash
# Firebase Console → Project Settings → Service Accounts
# Generate new private key → salva JSON
cat serviceAccountKey.json | base64 -w 0 > serviceAccount.b64
# Cole o conteúdo em FIREBASE_SERVICE_ACCOUNT_TOPPKB
```

---

## 3. Deploy manual

```bash
# 1. Build frontend
cd frontend && npm run build && cd ..

# 2. Deploy rules + indexes primeiro
firebase deploy --only firestore:rules,firestore:indexes,storage

# 3. Deploy functions
firebase deploy --only functions

# 4. Deploy hosting
firebase deploy --only hosting

# Ou tudo de uma vez:
firebase deploy
```

---

## 4. Deploy via CI/CD (GitHub Actions)

Push para `main` dispara deploy automático (veja `.github/workflows/deploy-prod.yml`).

```bash
git add .
git commit -m "feat: nova feature"
git push origin main
```

Acompanhe em **GitHub → Actions**.

---

## 5. Domínio customizado (opcional)

1. Compre o domínio (ex: `toppickleball50.app`)
2. Firebase Console → Hosting → Add custom domain
3. Siga as instruções de DNS (A record + TXT)
4. Aguarde propagação (até 48h)
5. Atualize `PUBLIC_URL` e `ALLOWED_ORIGINS` no `.env`

---

## 6. Verificação pós-deploy

```bash
# Smoke test
curl https://toppkb.web.app/api/health
# Deve retornar: {"status":"ok","version":"0.1.0"}

# Logs
firebase functions:log --only api

# Firestore
firebase firestore:indexes

# Hosting
firebase hosting:channel:list
```

---

## 7. Rollback

### 7.1 Rollback de hosting
```bash
firebase hosting:clone \
  --source=toppkb:$(firebase hosting:channel:list | grep previous | awk '{print $1}') \
  --target=live
```

### 7.2 Rollback de functions
```bash
# Listar versões
gcloud functions versions list --service=api --region=southamerica-east1

# Redirecionar 100% para versão anterior
gcloud functions services traffic-split api \
  --region=southamerica-east1 \
  --versions=v1=0,v2=100
```

---

## 8. Custos esperados

| Recurso | Free tier | 1 user | 10 users |
|---|---|---|---|
| Firestore reads | 20k/dia | 5k/dia | 50k/dia |
| Firestore writes | 20k/dia | 2k/dia | 20k/dia |
| Functions invocations | 2M/mês | 50k/mês | 500k/mês |
| Functions GB-s | 400k/mês | 5k/mês | 50k/mês |
| Hosting GB | 10GB | 1GB | 1GB |
| Storage | 5GB | 100MB | 1GB |
| Gemini Flash tokens | 1M/dia | 200k/dia | 2M/dia |

**Total estimado:** < $5/mês com 1 usuário, < $30/mês com 10 usuários ativos.

---

## 9. Próximo

[`04-OPERACAO.md`](./04-OPERACAO.md) — como operar e monitorar em produção.
