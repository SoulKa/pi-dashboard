# Pi Dashboard

A fullscreen kiosk dashboard for Raspberry Pi 4 (720×1280 portrait display) showing:

- Current weather and tomorrow's hourly forecast via [Open-Meteo](https://open-meteo.com/)
- Upcoming VVS train/bus departures via the VVS EFA API

Built with Vue 3, TypeScript, Vite, and UnoCSS.

---

## Configuration

Copy the example config and fill in your values (gitignored — never committed):

```bash
cp dashboard.config.example.json dashboard.config.json
```

```json
{
  "location": {
    "latitude": 48.8131,
    "longitude": 9.3639
  },
  "station": {
    "id": 5006118
  }
}
```

| Field | Description |
| --- | --- |
| `location.latitude` / `location.longitude` | Coordinates for weather data (decimal degrees) |
| `station.id` | VVS stop ID — find yours at [vvs.de](https://www.vvs.de) or via the EFA API |

The config is read at **build time** and bundled into the output. Changing it requires a rebuild.

---

## Development

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` and proxies VVS API requests to avoid CORS issues.

```bash
npm run test        # run tests once
npm run test:watch  # watch mode
```

---

## Production Build

```bash
npm run build
```

Output goes to `dist/`. The built files are static and can be served by any web server.

> **Note:** In production the Vite dev proxy is not available. The web server must proxy `/api/vvs/` to the VVS API — the nginx config in `deploy/` does this automatically.

---

## Raspberry Pi Deployment

### Quick setup (fresh Pi)

```bash
bash deploy/install.sh
```

This single script handles everything: installs Node.js, nginx, and unclutter, builds the project, deploys to the web root, configures nginx, installs a desktop icon, and sets up cursor hiding. Reboot when it finishes.

If `dashboard.config.json` is missing the script creates it from the example and stops — fill in your coordinates and station ID, then run it again.

To undo everything: `bash deploy/uninstall.sh`.

---

### What the script does (step by step)

#### 1. Install system dependencies

Installs Node.js 24 (via NodeSource) and nginx:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs nginx unclutter
```

#### 2. Build

```bash
npm install
npm run build
sudo cp -r dist/* /var/www/pi-dashboard/
```

#### 3. Configure nginx

Copies `deploy/nginx-site.conf` to `/etc/nginx/sites-available/pi-dashboard` and enables it. The config proxies `/api/vvs/` to the VVS API (CORS bypass) and serves the SPA with a fallback to `index.html`.

```bash
sudo ln -sf /etc/nginx/sites-available/pi-dashboard /etc/nginx/sites-enabled/pi-dashboard
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl enable --now nginx
```

#### 4. Cursor hiding

Copies `deploy/autostart` to `~/.config/lxsession/LXDE-pi/autostart`. This runs `unclutter` at login, which hides the mouse cursor after 0.1 s of inactivity.

#### 5. Desktop icon

Copies `deploy/pi-dashboard.desktop` to `~/Desktop/` and marks it trusted. Double-click it to launch the dashboard in fullscreen kiosk mode. Close with **Alt+F4**.

Requires Raspberry Pi OS with Desktop and auto-login enabled.

---

## Update workflow

After changing source files:

```bash
bash deploy/update.sh
```

Rebuilds and syncs `dist/` to the web root. nginx serves the new files immediately — no restart needed.
