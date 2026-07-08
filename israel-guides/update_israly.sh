#!/usr/bin/env bash
# Israly — mise à jour (pull propre + rebuild + restart)
set -euo pipefail

APP_NAME="israly"
APP_DIR="/var/www/israly"
BRANCH="main"

cd "$APP_DIR"
echo "▶ Mise à jour d'Israly ($BRANCH)"

# Récupère l'état exact du repo (écrase les modifs locales, garde .env qui est git-ignoré)
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "▶ Dépendances"
npm ci

echo "▶ Prisma generate"
npm run db:generate
# décommente si tu as changé le schéma :
# npm run db:push

echo "▶ Build"
npm run build

echo "▶ Redémarrage PM2"
pm2 restart "$APP_NAME" --update-env
pm2 save

echo "✅ Israly mis à jour."
