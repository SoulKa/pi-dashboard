#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$DEPLOY_DIR")"
WEB_ROOT="/var/www/pi-dashboard"

echo "=== Pi Dashboard Install ==="

# ── 1. System dependencies ────────────────────────────────────────────────────
echo ">> Installing Node.js 24 and nginx..."
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs nginx unclutter attr
hash -r

# ── 2. Config check ───────────────────────────────────────────────────────────
if [ ! -f "$PROJECT_DIR/dashboard.config.json" ]; then
    cp "$PROJECT_DIR/dashboard.config.example.json" "$PROJECT_DIR/dashboard.config.json"
    echo ""
    echo "  dashboard.config.json created from the example."
    echo "  Edit it with your coordinates and VVS station ID, then re-run this script."
    echo ""
    exit 1
fi

# ── 3. Build ──────────────────────────────────────────────────────────────────
echo ">> Building..."
cd "$PROJECT_DIR"
npm install
npm run build

# ── 4. Deploy to web root ─────────────────────────────────────────────────────
echo ">> Deploying to $WEB_ROOT..."
sudo mkdir -p "$WEB_ROOT"
sudo cp -r dist/* "$WEB_ROOT/"

# ── 5. nginx ──────────────────────────────────────────────────────────────────
echo ">> Configuring nginx..."
sudo cp "$DEPLOY_DIR/nginx-site.conf" /etc/nginx/sites-available/pi-dashboard
sudo ln -sf /etc/nginx/sites-available/pi-dashboard /etc/nginx/sites-enabled/pi-dashboard
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# ── 6. Autostart (cursor hiding) ─────────────────────────────────────────────
echo ">> Installing autostart..."
mkdir -p ~/.config/lxsession/LXDE-pi
cp "$DEPLOY_DIR/autostart" ~/.config/lxsession/LXDE-pi/autostart

# ── 7. Desktop icon ───────────────────────────────────────────────────────────
echo ">> Installing desktop icon..."
sudo cp "$DEPLOY_DIR/icon.svg" /usr/share/pixmaps/pi-dashboard.svg
mkdir -p ~/Desktop
cp "$DEPLOY_DIR/pi-dashboard.desktop" ~/Desktop/pi-dashboard.desktop
chmod +x ~/Desktop/pi-dashboard.desktop
setfattr -n user.metadata::trusted -v yes ~/Desktop/pi-dashboard.desktop

echo ""
echo "=== Install complete! Reboot, then double-click the desktop icon to launch. ==="
