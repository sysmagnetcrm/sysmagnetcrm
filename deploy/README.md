# Eron-CRM – VPS Deployment Guide (Supabase-only)

This guide describes how to deploy the Supabase-backed server and React client to a VPS using PM2 and Nginx with HTTPS.

## Prerequisites

- Ubuntu 22.04+ (or similar)
- Node.js 18+ and npm
- PM2 (`npm i -g pm2`)
- Nginx
- Certbot (`sudo snap install --classic certbot`)
- A domain pointing to your VPS IP (A records)
- Supabase project with keys

## Environment Variables (do NOT commit)

Set these in your VPS environment (e.g., using PM2 ecosystem or systemd Environment):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT=3001`
- `NODE_ENV=production`
- `ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`
- `JWT_SECRET=<rotate a strong secret>`

Rotate any secrets that were previously committed.

## Server Setup

1) Clone repo on the server

```
git clone <your-repo-url>.git
cd Sysdevcode-crm/server
npm ci
```

2) Start with PM2

```
# Optional: edit ecosystem.config.js to add env vars or use PM2 set env
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # follow instructions to enable on boot
```

To set env variables securely without committing, use PM2 runtime env:

```
pm2 set pm2:eron-crm:SUPABASE_URL https://YOUR-PROJECT.supabase.co
# ... repeat for other keys ...
```

Alternatively, use a systemd unit with Environment entries.

## Client Build

```
cd ../client
npm ci
# In client/.env.production set VITE_API_URL=https://yourdomain.com/api
npm run build
# Copy dist/ to a web root or serve via Nginx
```

If you want the server to serve the built client, ensure `NODE_ENV=production` and copy `client/dist` into `client/dist` under repo root on the server. The Supabase server will serve it automatically for non-`/api/` routes.

## Nginx Configuration

Create a server block using `deploy/nginx-example.conf` as a reference. Key points:

- Proxy `/api/` to `http://127.0.0.1:3001`
- Serve the client `dist/` as static files (recommended), or let the Node server serve in production mode
- Enable gzip and caching for static assets

Enable the site:

```
sudo ln -s /path/to/deploy/nginx-example.conf /etc/nginx/sites-available/eron-crm
sudo ln -s /etc/nginx/sites-available/eron-crm /etc/nginx/sites-enabled/eron-crm
sudo nginx -t
sudo systemctl reload nginx
```

## TLS (HTTPS)

```
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will edit your Nginx config to add SSL blocks and auto-renew timers.

## Health Checks

- `GET https://yourdomain.com/api/ping` should return `{ ok: true }`.
- `GET https://yourdomain.com/api/health` validates Supabase connectivity and missing tables.

## Notes

- This project includes a legacy SQLite server at `server/server.js`. For Supabase-only deployments, prefer `server/server.supabase.js` and consider removing the legacy files to avoid confusion.
- Populate Supabase using the SQL in `server/supabase.schema.sql` and then design RLS policies according to your access model.
