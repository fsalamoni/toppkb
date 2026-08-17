# 🚀 Guia de Instalação — Top Pickleball 50+

> Setup completo do ambiente de desenvolvimento local.

---

## 1. Pré-requisitos

| Ferramenta | Versão mínima | Para que serve |
|---|---|---|
| **Node.js** | 20 LTS | Runtime do front e backend |
| **npm** | 10+ | Gerenciador de pacotes |
| **Git** | 2.30+ | Versionamento |
| **Firebase CLI** | 13+ | Deploy + emuladores |
| **Java JRE** | 11+ | Emulador Firestore |
| Conta **Firebase** | — | Auth, Firestore, Functions, Hosting |
| Conta em algum LLM (opcional) | — | API key de **qualquer um** dos 17 provedores (Google AI, OpenAI, Anthropic, etc) |

---

## 2. Instalar ferramentas

### 2.1 Node.js
```bash
# macOS (via Homebrew)
brew install node@20

# Linux (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20

# Windows
# Baixe de https://nodejs.org/dist/v20.14.0/
```

### 2.2 Firebase CLI
```bash
npm install -g firebase-tools

# Login
firebase login

# Verificar
firebase --version
```

### 2.3 Java (para emulador Firestore)
```bash
# macOS
brew install openjdk@11

# Linux
sudo apt install default-jre

# Windows
# Baixe JDK 11+ de https://adoptium.net/
```

---

## 3. Criar projeto Firebase

1. Acesse https://console.firebase.google.com/
2. Clique em **"Adicionar projeto"**
3. Nome: `toppkb-dev` (ou o que preferir)
4. Ative o **Google Analytics** (opcional)
5. No menu lateral, ative:
   - **Authentication** → Sign-in method → **Email link (passwordless)**
   - **Firestore Database** → Criar banco (modo produção, região: `southamerica-east1`)
   - **Functions** → Upgrade para plano Blaze (necessário p/ Cloud Functions)
   - **Hosting** → Get started
6. Em **Configurações do projeto → Geral → Seus apps**, adicione um app **Web**:
   - Apelido: `toppkb-web`
   - Copie o objeto `firebaseConfig` — você vai usar no `.env.local`

---

## 4. Clonar o repositório

```bash
git clone https://github.com/fsalamoni/toppkb.git
cd toppkb
```

---

## 5. Configurar variáveis de ambiente

```bash
# Copie o exemplo
cp .env.example .env.local

# Edite e preencha:
# - FIREBASE_PROJECT_ID (seu project ID)
# - FIREBASE_CONFIG (objeto JSON do console Firebase)
# - (Opcional) NÃO precisa de LLM_API_KEY no .env — o LLM é configurado via UI
#   após o primeiro login (Admin → LLM Global), e o sistema é provider-agnostic.
# - GOOGLE_APPLICATION_CREDENTIALS (caminho do service account)
```

### 5.1 Baixar service account

1. Firebase Console → Configurações do projeto → **Service Accounts**
2. Clique em **"Generate new private key"**
3. Salve como `serviceAccountKey.json` na raiz do projeto
4. **NUNCA** commite esse arquivo (já está no `.gitignore`)

---

## 6. Instalar dependências

```bash
# Workspace root (instala em frontend/ e functions/ simultaneamente)
npm install

# Ou separadamente:
cd frontend && npm install
cd ../functions && npm install
```

---

## 7. Configurar Firebase

```bash
# Apontar para o seu projeto
firebase use --add
# Selecione `toppkb-dev` (ou o ID que você criou)

# Verificar aliases
cat .firebaserc
```

Edite `.firebaserc` se necessário:

```json
{
  "projects": {
    "default": "seu-project-id",
    "dev": "seu-project-id-dev",
    "prod": "seu-project-id"
  }
}
```

---

## 8. Deploy das regras (uma vez)

```bash
# Deploy rules + indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy storage rules
firebase deploy --only storage
```

---

## 9. Rodar localmente

### 9.1 Terminal 1 — Emuladores (Firestore + Auth + Functions)
```bash
cd functions
npm run serve
# Aguarde: "All emulators ready!"
# UI: http://localhost:4000
```

### 9.2 Terminal 2 — Frontend
```bash
cd frontend
npm run dev
# Abra http://localhost:5173
```

### 9.3 Configurar frontend para usar emuladores

Crie `frontend/.env.local`:
```bash
VITE_USE_EMULATORS=true
VITE_FIREBASE_PROJECT_ID=toppkb-dev
VITE_FIREBASE_AUTH_DOMAIN=toppkb-dev.firebaseapp.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_EMULATOR_URL=http://localhost:9099
VITE_FIRESTORE_EMULATOR_HOST=localhost
VITE_FIRESTORE_EMULATOR_PORT=8080
VITE_FUNCTIONS_EMULATOR_URL=http://localhost:5001
```

---

## 10. Testar login

1. Abra `http://localhost:5173`
2. Insira seu e-mail
3. Clique em "Entrar com link mágico"
4. No terminal/console do emulador de Auth, copie o link mágico enviado
5. Cole no navegador

---

## 11. Comandos úteis

```bash
# Build de produção do frontend
cd frontend && npm run build

# Build do functions
cd functions && npm run build

# Rodar testes
cd frontend && npm test
cd functions && npm test

# Lint
npm run lint --workspaces

# Typecheck
npm run typecheck --workspaces

# Logs das functions em produção
firebase functions:log

# Emuladores (start com UI)
firebase emulators:start --import=./.firebase/data --export-on-exit
```

---

## 12. Problemas comuns

### ❌ "Could not load the default credentials"
**Solução:** configure `GOOGLE_APPLICATION_CREDENTIALS` apontando para o service account JSON.

### ❌ "Permission denied" no Firestore
**Solução:** rode `firebase deploy --only firestore:rules` e verifique se o usuário tem consent.

### ❌ LLM retorna 429 (rate limit)
**Solução:** rate limit do provider configurado. Aguarde 1 min ou faça upgrade do plano, ou troque de provider (17 opções disponíveis).

### ❌ Functions cold start
**Solução:** Cloud Functions Gen 2 pode levar 5-10s na primeira chamada. Configurar min instances no plano Blaze.

### ❌ Porta 5000 ocupada
**Solução:** mude no `firebase.json`:
```json
"emulators": { "hosting": { "port": 5001 } }
```

---

## 13. Próximo passo

Depois de tudo rodando localmente, siga para [`02-ARQUITETURA.md`](./02-ARQUITETURA.md) para entender a fundo a estrutura do código.
