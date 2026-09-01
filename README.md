# Gotham — Unified CCTV Grid

Gujarat Police's real-time camera/detection/trace/alert console, built with
React + TypeScript + Vite, deployed as a static bundle behind nginx, talking
to a separate FastAPI backend over `/api`.

## Stack

- React 18 + TypeScript + Vite 5 (static build)
- Nginx (serving the static bundle, proxying `/api` to the backend)
- Let's Encrypt SSL (Certbot)
- Backend: a separate FastAPI/uvicorn service on `:8000` — not part of this
  repo; see [§5](#5-the-backend-a-separate-service) before assuming it's
  managed the same way as the frontend.

---

## 1) Local development

### Requirements

- Node.js 20+ (see `.nvmrc` — the system default Node on some machines is
  too old for Vite 5; run `nvm use` first if you have nvm installed)
- npm 9+

### Run

```bash
nvm use
npm install
npm run dev
```

Open: `http://localhost:5173`

There is **no dev proxy** here (unlike some Vite setups) — the app calls
the backend directly at `VITE_API_BASE_URL` (default `http://localhost:8000`),
cross-origin. That only works because the backend sends CORS headers
(`Access-Control-Allow-Origin` + `-Credentials: true`) and issues its
session cookie as `SameSite=Lax`, which survives a same-host/different-port
request. Run the backend locally on `:8000`, or point `VITE_API_BASE_URL`
(below) at wherever it's actually reachable.

---

## 2) Environment variables

| Variable | Local dev default | Production value | Used by |
|---|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | `` (empty — see below) | `src/config/env.ts`, prepended to every request path in `apiClient.ts`, `postSse.ts`, `buildExportUrl.ts` |
| `VITE_CARTO_API_KEY` | your CARTO key (`.env.local`) | your CARTO key (`.env.production.local` on the server) | `src/lib/cartoTileUrl.ts` — without it, the map's basemap tiles render an "API key required" watermark instead of the real map |

**`VITE_API_BASE_URL` is not a path prefix here — it's a host prefix.**
Every request path already starts with `/api` in the hook code itself
(e.g. `apiClient.get('/api/me')`), and `API_BASE_URL` is concatenated
directly in front of it. So:

- In local dev, `VITE_API_BASE_URL=http://localhost:8000` makes requests go
  to `http://localhost:8000/api/me` — a real cross-origin request.
- In production, `VITE_API_BASE_URL=` (empty string, set in the committed
  `.env.production`) makes the exact same code produce `/api/me` — a
  same-origin, relative request that nginx proxies to the backend (see
  [§3.4](#34-api--swagger-docs)). **Do not set it to the domain** — leaving
  it unset in production falls back to the code default
  (`http://localhost:8000`, the browser's own machine), and setting it to
  `https://gotham.heliosinfotech.in` would just be a slower way of writing
  the same thing the empty string already does for free.

Both `.env` files are read only at **build** time, not runtime — Vite
inlines them into the bundle. Changing either one always means rebuilding
(`npm run build` locally, or `./deploy.sh` in prod — see [§4](#4-deploying-build--sync)).

The CARTO key is a secret and is never committed. Locally it lives in
`.env.local` (gitignored via the existing `*.local` pattern). On the server
it goes in `.env.production.local` — same pattern, create it once:

```bash
echo "VITE_CARTO_API_KEY=<your key>" > .env.production.local
```

---

## 3) Ubuntu production setup

### 3.1 Prerequisites

- Ubuntu 22.04+ VM with SSH + sudo access
- The subdomain `gotham.heliosinfotech.in` pointed at the VM — see
  [§3.2](#32-dns)
- The backend already running on `127.0.0.1:8000` (see
  [§5](#5-the-backend-a-separate-service) — this repo does not start it)

Install base tools:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx rsync curl
```

Install Node 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 3.2 DNS

In the DNS provider for `heliosinfotech.in` (GoDaddy), add:

- **A record**: `gotham` → `<VM_PUBLIC_IP>`

Wait for propagation before running Certbot — it validates over HTTP and
will fail if the domain doesn't resolve to this box yet.

### 3.3 nginx — bootstrap FIRST, Certbot SECOND

**This order matters and skipping it is the most common way to break nginx
on this box.** Certbot's SSL block references certificate files
(`/etc/letsencrypt/live/.../fullchain.pem`) that don't exist until Certbot
has actually issued them. If a `listen 443 ssl` block pointing at those
paths is live *before* that happens, nginx refuses to start or reload:

```
nginx: [emerg] cannot load certificate "/etc/letsencrypt/live/gotham.heliosinfotech.in/fullchain.pem": No such file or directory
```

...and every other site nginx serves on this box goes down with it, not
just Gotham — `nginx -t` tests the *entire* config, and one broken
`sites-enabled` file fails the whole reload. So:

**Step 1 — deploy the static files** (needed either way, and Certbot's
HTTP validation serves a file from this directory):

```bash
sudo mkdir -p /var/www/gotham
sudo chown -R $USER:$USER /var/www/gotham
echo "VITE_CARTO_API_KEY=<your key>" > .env.production.local
./deploy.sh   # see §4
```

**Step 2 — install the HTTP-only bootstrap config** —
[`deploy/nginx-gotham-bootstrap.conf`](deploy/nginx-gotham-bootstrap.conf).
It has no `listen ... ssl` and no `ssl_certificate` line, so there is
nothing in it that can fail to load:

```bash
sudo cp deploy/nginx-gotham-bootstrap.conf /etc/nginx/sites-available/gotham
sudo ln -sfn /etc/nginx/sites-available/gotham /etc/nginx/sites-enabled/gotham
sudo nginx -t
sudo systemctl reload nginx
```

Confirm `http://gotham.heliosinfotech.in` serves the site before
continuing.

**Step 3 — run Certbot**, only now:

```bash
sudo certbot --nginx -d gotham.heliosinfotech.in
```

Certbot's `--nginx` plugin issues the certificate, then **rewrites
`/etc/nginx/sites-available/gotham` itself** — adding the HTTP→HTTPS
redirect and the `listen 443 ssl` server block, with `# managed by Certbot`
markers. You don't hand-write that part.

Test renewal (does not actually renew, just validates the process works):

```bash
sudo certbot renew --dry-run
```

**Step 4 — check the result.** The file should now match
[`deploy/nginx-gotham.conf`](deploy/nginx-gotham.conf), which is a checked-in
copy of the live config for reference and disaster recovery — restore *that*
file (not the bootstrap one) if `/etc/nginx/sites-available/gotham` is ever
lost, since it already has both the SSL block and the API routing below.

If you ever need to update `server_name` or add a `www` alias, edit
`/etc/nginx/sites-available/gotham` directly and re-run
`sudo nginx -t && sudo systemctl reload nginx` — Certbot only re-runs its
own rewrite when you re-run `certbot --nginx`.

### 3.4 API + Swagger docs

Unlike a setup with multiple API generations, Gotham's backend serves one
API and already owns the `/api` prefix on its own routes — confirmed by the
route shapes themselves (`GET /api/me`, `GET /api/cameras`, not `GET /me`).
So the main API block is a **plain pass-through**, no path rewriting:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;   # no trailing slash = no rewrite
    ...
}
```

**Swagger docs are the one exception.** FastAPI mounts its interactive
docs at the backend's *root* `/docs` (and its spec at root `/openapi.json`)
— those routes are **not** behind the `/api` prefix the way the real API
routes are, because only the API router itself was mounted with that
prefix. So `https://gotham.heliosinfotech.in/api/docs` needs its own
rewrite to the backend's unprefixed `/docs`, matched over the block above
because nginx picks the longest literal prefix, not file order:

```nginx
location /api/docs {
    proxy_pass http://127.0.0.1:8000/docs;
    ...
}
```

Both `deploy/nginx-gotham-bootstrap.conf` and `deploy/nginx-gotham.conf`
already have this right.

**Known gotcha:** the docs page itself works once this block is in place,
but "Try it out" inside Swagger UI may fail to load the spec. FastAPI's
`/docs` HTML embeds an *absolute* `openapi_url` (`/openapi.json` by
default) — the backend has no way to know it's being served under `/api`
unless it's told. The browser then requests
`https://gotham.heliosinfotech.in/openapi.json` (no `/api`), which nginx
has no block for. Two fixes, in order of preference:

1. **Backend-side (correct fix):** run uvicorn with `--root-path /api`
   (or construct the app with `FastAPI(root_path="/api")`). This makes
   FastAPI aware of its mount point and every link it generates — docs,
   spec, redirects — comes back already `/api`-prefixed.
2. **Nginx-side (stopgap, if you can't touch the backend):** add a
   root-level passthrough —
   ```nginx
   location = /openapi.json {
       proxy_pass http://127.0.0.1:8000/openapi.json;
   }
   ```
   This isn't in the checked-in configs by default since it only papers
   over the symptom; prefer fix #1 if you own the backend deploy.

### 3.5 If Certbot / Let's Encrypt isn't an option (GoDaddy manual SSL)

You do **not** obtain a "root CA certificate" yourself — root CAs are
already trusted by every browser and OS. You only need a **server
certificate** issued by a trusted CA, plus its intermediate chain. Prefer
Certbot ([§3.3](#33-nginx-bootstrap-first-certbot-second)); use this only
if it's genuinely unavailable.

1. Generate a private key and CSR on the server:

   ```bash
   sudo openssl req -new -newkey rsa:2048 -nodes \
     -keyout /etc/ssl/private/gotham.heliosinfotech.in.key \
     -out /tmp/gotham.heliosinfotech.in.csr
   ```

2. Submit `/tmp/gotham.heliosinfotech.in.csr` to GoDaddy's SSL product and
   complete domain validation.
3. Download the issued server certificate and intermediate bundle, place
   them on the server, e.g.:
   - `/etc/ssl/certs/gotham.heliosinfotech.in.crt`
   - `/etc/ssl/certs/gd_bundle-g2-g1.crt`
4. Build the full chain file:

   ```bash
   sudo bash -c 'cat /etc/ssl/certs/gotham.heliosinfotech.in.crt /etc/ssl/certs/gd_bundle-g2-g1.crt > /etc/ssl/certs/gotham.heliosinfotech.in.fullchain.crt'
   ```

5. In the SSL server block, replace the Certbot-managed lines with:

   ```nginx
   ssl_certificate /etc/ssl/certs/gotham.heliosinfotech.in.fullchain.crt;
   ssl_certificate_key /etc/ssl/private/gotham.heliosinfotech.in.key;
   ```

   Same rule as [§3.3](#33-nginx-bootstrap-first-certbot-second) applies:
   don't enable this block until those exact files exist on disk.

6. Validate and reload:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

7. Verify the chain is served correctly, with no trust errors:

   ```bash
   openssl s_client -connect gotham.heliosinfotech.in:443 -servername gotham.heliosinfotech.in -showcerts </dev/null
   ```

---

## 4) Deploying (build + sync)

[`deploy.sh`](deploy.sh) does the whole build-and-sync in one step —
install, build, `rsync --delete` the bundle to `/var/www/gotham/`, which
nginx serves as static files:

```bash
git pull
./deploy.sh
```

No reload is needed for a normal deploy — nginx serves whatever files are
on disk, and there's no server-side caching layer in front of it. You only
need `sudo systemctl reload nginx` after changing the nginx *config* itself
(the SSL/API blocks, not the app bundle).

By default it deploys to `/var/www/gotham`; override with
`GOTHAM_DEPLOY_DIR=/some/other/path ./deploy.sh` if needed.

**Rollback:** this repo does not currently keep prior builds — `rsync
--delete` replaces `/var/www/gotham/` in place, so there's no
previous-release directory to swap back to. To roll back, check out the
older commit and redeploy:

```bash
git checkout <previous-commit-or-tag>
./deploy.sh
git checkout main   # or your branch, once done
```

If rollback speed ever becomes a real requirement, a releases/`current`
symlink scheme (build into a timestamped directory, symlink `current` to
it, point nginx's `root` at the symlink) is the standard fix — just not
implemented here today.

---

## 5) The backend — a separate service

The API on `:8000` is a separate FastAPI/uvicorn process, **not part of
this repo and not started by `deploy.sh`**. Confirm the deployment process
it currently runs under (systemd unit vs. a bare `uvicorn` process) before
assuming it restarts automatically on crash or server reboot — if it's
running as a plain process, that's worth fixing with a proper systemd unit
(`Restart=on-failure`) rather than assumed to already be in place.

Check it's up:

```bash
curl -s http://127.0.0.1:8000/api/me   # expect a 401 (not a connection error) when signed out
ss -tulpn | grep 8000
```

---

## 6) Troubleshooting

**`nginx: [emerg] cannot load certificate ".../fullchain.pem": No such file or directory`**
The SSL server block is enabled before Certbot has issued the certificate.
Fix: install [`deploy/nginx-gotham-bootstrap.conf`](deploy/nginx-gotham-bootstrap.conf)
(no SSL directives), confirm `nginx -t` passes and reload, *then* run
`certbot --nginx` — see [§3.3](#33-nginx-bootstrap-first-certbot-second).

**API calls in production hit `localhost:8000` in the browser's network tab**
`VITE_API_BASE_URL` wasn't empty at build time — check `.env.production`
still has `VITE_API_BASE_URL=` (blank) and that you rebuilt after any
change (`./deploy.sh`, not just editing the file). See
[§2](#2-environment-variables).

**`/api/docs` loads but "Try it out" / the spec fails**
Swagger UI's embedded `openapi_url` isn't `/api`-aware — see the gotcha in
[§3.4](#34-api--swagger-docs) for the fix.

**Map shows a black/blank tile grid or an "API key required" watermark**
`VITE_CARTO_API_KEY` wasn't set (or wasn't picked up) at build time. On the
server, confirm `.env.production.local` exists with the real key, then
rebuild — see [§2](#2-environment-variables).

**`cp: cannot stat 'dist/*'`**
The build didn't run, or failed silently. Run `npm run build` and confirm
`dist/` exists before `./deploy.sh`'s rsync step runs.

**`nginx disable` doesn't work**
Not a real nginx command. Manage sites via the symlink in
`/etc/nginx/sites-enabled/` — remove the symlink to disable, then
`sudo nginx -t && sudo systemctl reload nginx`.

---

## 7) Helpful checks

```bash
# nginx status + config test
sudo systemctl status nginx
sudo nginx -t

# what's listening
sudo ss -tulpn | grep -E ':80|:443|:8000'

# nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# certificate status + expiry
sudo certbot certificates
```

---

## 8) Security basics (recommended, not currently enabled)

```bash
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Keep Ubuntu packages updated regularly.
