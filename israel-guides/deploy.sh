#!/usr/bin/env bash
# Israly — premier déploiement (Hetzner + nginx + PM2)
set -euo pipefail

# ===== Config (à ajuster) =====
APP_NAME="israly"
DOMAIN="israly.com"
APP_DIR="/var/www/israly"
PORT="3001"                       # Israly sur 3001 pour cohabiter avec Tibeb
REPO="https://github.com/davidmaimoun/israly.git"
BRANCH="main"
# ==============================

echo "▶ Israly — déploiement initial"

command -v node >/dev/null || { echo "Node.js manquant (installe Node 20+)"; exit 1; }
NODE_MAJOR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
[ "$NODE_MAJOR" -ge 20 ] || { echo "Node 20+ requis (tu as $(node -v))"; exit 1; }
command -v pm2 >/dev/null || { echo "▶ Installation de PM2…"; npm install -g pm2; }

# Clone (ou réutilise) le repo
if [ ! -d "$APP_DIR/.git" ]; then
  echo "▶ Clone du repo dans $APP_DIR"
  sudo mkdir -p "$APP_DIR"
  sudo chown -R "$USER":"$USER" "$APP_DIR"
  git clone -b "$BRANCH" "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

# .env — on ne l'écrase jamais
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "⚠  Un fichier .env a été créé depuis .env.example."
  echo "   Remplis-le (DATABASE_URL, AUTH_SECRET, AUTH_URL=https://$DOMAIN, RESEND_API_KEY, EMAIL_FROM…)"
  echo "   puis relance ./deploy.sh"
  exit 0
fi

echo "▶ Installation des dépendances"
npm ci

echo "▶ Prisma (client + collections/index)"
npm run db:generate
npm run db:push

echo "▶ Build production"
npm run build

echo "▶ Démarrage PM2 (port $PORT)"
pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
PORT="$PORT" pm2 start npm --name "$APP_NAME" -- start
pm2 save
pm2 startup >/dev/null 2>&1 || true

echo ""
echo "✅ Israly tourne sur http://127.0.0.1:$PORT (via PM2 : $APP_NAME)"
echo ""
echo "Étapes restantes (une seule fois) :"
echo "  1) Copie deploy/nginx-israly.conf -> /etc/nginx/sites-available/$APP_NAME"
echo "     puis : sudo ln -s /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/"
echo "  2) sudo nginx -t && sudo systemctl reload nginx"
echo "  3) HTTPS : sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "Pour les mises à jour suivantes : ./update_israly.sh"
