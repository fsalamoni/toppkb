# Top Pickleball 50+ — Setup Completo

Guia passo-a-passo para configurar o ambiente de desenvolvimento do zero até deploy em produção.

## Pré-requisitos

- Node 20+
- npm 10+
- Firebase CLI (`npm i -g firebase-tools`)
- Git
- Conta Google (para Firebase)
- Uma chave de API de LLM (Gemini é a padrão, gratuita em tier free)

## 1) Clonar o repositório

```bash
git clone https://github.com/fsalamoni/toppkb.git
cd toppkb
```

## 2) Instalar dependências

```bash
npm install --prefix frontend
npm install --prefix functions
```

## 3) Configurar Firebase

### 3.1 Criar projeto

1. Acesse https://console.firebase.google.com
2. Crie projeto `toppkb-dev` (ou outro nome)
3. Habilite Authentication → Email Link (Magic Link)
4. Habilite Firestore (modo production)
5. Habilite Cloud Functions (plano Blaze)
6. Habilite App Check (recomendado)

### 3.2 Login

```bash
firebase login
firebase use --add  # selecione toppkb-dev
```

### 3.3 Variáveis de ambiente

```bash
cp .env.example .env
# edite .env com seus valores
```

## 4) Configurar LLM

### Opção A: Como Admin Master (recomendado)

1. Faça deploy das functions
2. Acesse o app pela primeira vez (você será admin master automaticamente)
3. Vá em Admin → LLM Global
4. Cole sua chave Gemini
5. Salve

### Opção B: Como usuário

1. Faça login
2. Vá em Configurações → Meu LLM Pessoal
3. Adicione sua chave pessoal

A chave é armazenada no Firestore com regras restritivas (master-only ou owner-only). Nunca é exposta ao frontend (sempre mascarada).

## 5) Deploy

### Frontend + Functions

```bash
cd functions
npm run build
firebase deploy --only functions
cd ../frontend
npm run build
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

Ou tudo de uma vez:

```bash
firebase deploy
```

## 6) Configurar regras de admin

O **primeiro usuário** que se registrar vira `admin master` automaticamente.
Para promover outros admins depois:

```bash
# Via UI: Admin → Usuários → Adicionar admin
# Ou via API callable:
firebase functions:shell
> adminGrantAdmin({ email: 'fulano@email.com', role: 'admin' })
```

## 7) Ingerir corpus (opcional)

```bash
# Ingerir um PDF:
ts-node scripts/ingest-pdf.ts data/raw/usapa-rulebook-2024.pdf

# Validar corpus:
ts-node scripts/validate-corpus.ts

# Re-indexar embeddings (se mudar de modelo):
ts-node scripts/reindex-corpus.ts
```

## 8) Testes

```bash
# Backend:
cd functions && npm test

# Frontend:
cd frontend && npm run typecheck
```

## 9) Monitoramento

- Firebase Console → Functions → Logs
- Sentry (se habilitado no `.env`)
- `system/analytics-weekly` doc (agregados)

## 10) Próximos passos

- Adicione fontes em `data/raw/sources.json`
- Rode `scripts/ingest-pdf.ts` periodicamente
- Configure backup do Firestore (Blaze plan)
- Ajuste as 5 personas dos agentes em `admin-config/agents`

## Troubleshooting

### "Permission denied" ao criar user
- Verifique se `onUserCreated` está deployed
- Verifique firestore.rules (master auto-grant)

### "LLM API error"
- Verifique se a chave está válida
- Teste: `curl -H "x-goog-api-key: $GEMINI_API_KEY" https://generativelanguage.googleapis.com/v1/models`

### "DEADLINE_EXCEEDED" em Cloud Functions
- Aumente timeout em `functions/src/index.ts`
- Divida batch em chunks menores

### "Vector dimension mismatch"
- Garanta que todos os chunks usem mesmo modelo de embedding
- Rode `scripts/reindex-corpus.ts`
