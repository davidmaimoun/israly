# Déploiement d'Israly (Hetzner + nginx + PM2)

## Prérequis serveur
- Node.js 20+ et npm
- PM2 (`npm i -g pm2`) — le script l'installe sinon
- nginx
- Une base MongoDB **en replica set** (Atlas recommandé en prod, sinon Mongo local en RS)
- Le DNS de `israly.com` pointe vers l'IP du serveur

## 1. Premier déploiement
```bash
git clone https://github.com/davidmaimoun/israly.git /var/www/israly
cd /var/www/israly
./deploy.sh          # crée .env depuis .env.example puis s'arrête
nano .env            # remplis les variables (voir ci-dessous)
./deploy.sh          # relance : install + prisma + build + PM2
```

### Variables `.env` importantes
```
DATABASE_URL="mongodb+srv://…/israly"       # Atlas (replica set)
AUTH_SECRET="<openssl rand -base64 33>"
AUTH_URL="https://israly.com"
RESEND_API_KEY="re_…"
EMAIL_FROM="Israly <no-reply@israly.com>"    # domaine vérifié dans Resend
ADMIN_EMAIL="contact@sudosudev.com"
NEXT_PUBLIC_WHATSAPP="+9725…"
```

## 2. nginx + HTTPS (une seule fois)
```bash
sudo cp deploy/nginx-israly.conf /etc/nginx/sites-available/israly
sudo ln -s /etc/nginx/sites-available/israly /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d israly.com -d www.israly.com
```

## 3. Seed initial (optionnel, pour des données de démo)
```bash
npm run seed
```
> ⚠️ Le seed **efface** les données existantes. Ne pas lancer sur une base de prod déjà remplie.

## 4. Mises à jour (à chaque nouvelle version)
```bash
cd /var/www/israly
./update_israly.sh
```
Le script fait `git reset --hard origin/main`, réinstalle, rebuild et redémarre PM2.
(Décommente la ligne `db:push` dans le script si tu as modifié le schéma Prisma.)

## Commandes utiles
```bash
pm2 status
pm2 logs israly
pm2 restart israly
```
