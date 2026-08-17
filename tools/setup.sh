#!/usr/bin/env bash
# ============================================
# Top Pickleball 50+ — Setup inicial
# ============================================
set -e

echo "🏓 Top Pickleball 50+ — Setup"
echo ""

# 1) Dependências
echo "📦 Instalando dependências..."
npm install
cd frontend && npm install && cd ..
cd functions && npm install && cd ..

# 2) Variáveis de ambiente
echo ""
echo "🔑 Configurando .env..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "  ✅ .env.local criado (edite com suas chaves)"
else
  echo "  ⏭️  .env.local já existe"
fi

if [ ! -f frontend/.env.local ]; then
  cp frontend/.env.example frontend/.env.local
  echo "  ✅ frontend/.env.local criado"
fi

if [ ! -f functions/.env ]; then
  cp functions/.env.example functions/.env
  echo "  ✅ functions/.env criado"
fi

# 3) Firebase login
echo ""
echo "🔥 Firebase CLI..."
if ! command -v firebase &> /dev/null; then
  echo "  ⚠️  Firebase CLI não instalado. Rode: npm install -g firebase-tools"
else
  firebase --version
fi

# 4) Java (para emuladores)
echo ""
echo "☕ Java (necessário para emuladores)..."
if command -v java &> /dev/null; then
  java -version
else
  echo "  ⚠️  Java não instalado. Emuladores não vão rodar."
  echo "  Instale JDK 11+: https://adoptium.net/"
fi

echo ""
echo "✨ Setup completo!"
echo ""
echo "Próximos passos:"
echo "  1. Edite .env.local com suas credenciais Firebase"
echo "  2. Edite frontend/.env.local com as configs do Firebase"
echo "  3. cd functions && npm run serve   # inicia emuladores"
echo "  4. cd frontend && npm run dev      # inicia o app em http://localhost:5173"
echo ""
echo "⚠️  Lembre-se: este projeto é provider-AGNOSTIC."
echo "   Nenhum LLM é padrão. Configure via UI após o primeiro login:"
echo "     • Admin → LLM Global (admin master)"
echo "     • Configurações → Meu LLM Pessoal (qualquer usuário)"
