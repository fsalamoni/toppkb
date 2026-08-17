#!/usr/bin/env bash
# ============================================
# Top Pickleball 50+ — Deploy
# ============================================
set -e

ENV=${1:-prod}
echo "🚀 Deploy para $ENV"

if [ "$ENV" = "prod" ]; then
  PROJECT="toppkb"
else
  PROJECT="toppkb-dev"
fi

echo "📦 Build do frontend..."
cd frontend
npm run build
cd ..

echo "📦 Build das functions..."
cd functions
npm run build
cd ..

echo "🔥 Deploy rules + indexes..."
firebase deploy --only firestore:rules,firestore:indexes,storage --project=$PROJECT

echo "⚡ Deploy functions..."
firebase deploy --only functions --project=$PROJECT

echo "🌐 Deploy hosting..."
firebase deploy --only hosting --project=$PROJECT

echo ""
echo "✅ Deploy concluído!"
echo "🌍 App: https://$PROJECT.web.app"
