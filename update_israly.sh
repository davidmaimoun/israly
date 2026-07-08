#!/usr/bin/env bash
# Israly — mise à jour (pull propre + rebuild + restart)
set -euo pipefail

APP_NAME="israly"
APP_DIR="/var/www/israly"
BRANCH="main"
PORT="3001"

# Refuse de tourner en root (on lance tout en tant qu'israly)
if [ "$(id -u)" = "0" ]; then
  echo "❌ Ne lance pas ce script en root. Utilise : sudo -iu israly bash -c '$APP_DIR/update_israly.sh'"
  exit 1
fi


export NVM_DIR="/home/israly/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null 2>&1 || nvm use default >/dev/null 2>&1

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
# start si l'app n'existe pas encore, sinon restart
pm2 restart "$APP_NAME" --update-env 2>/dev/null || PORT="$PORT" pm2 start "npm run start -- -p $PORT" --name "$APP_NAME"
pm2 save

echo "✅ Israly mis à jour."