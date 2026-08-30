```bash
# روی VPS
sudo apt update && sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo systemctl enable --now docker nginx

# استقرار پروژه
cd /opt/karvin
cp .env.example .env
# مقادیر امن DATABASE_URL، POSTGRES_PASSWORD، AUTH_SECRET و NEXT_PUBLIC_APP_URL را تنظیم کنید

docker compose up -d --build

# Nginx
sudo cp deploy/nginx/karvin.conf /etc/nginx/sites-available/karvin
sudo ln -sfn /etc/nginx/sites-available/karvin /etc/nginx/sites-enabled/karvin
sudo nginx -t && sudo systemctl reload nginx

# دریافت SSL (دامنه را جایگزین کنید)
sudo certbot --nginx -d example.com -d www.example.com --redirect --agree-tos --no-eff-email -m admin@example.com

# تمدید آزمایشی
sudo certbot renew --dry-run
```
