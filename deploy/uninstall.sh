#!/usr/bin/env bash
set -euo pipefail

WEB_ROOT="/var/www/pi-dashboard"
AUTOSTART="$HOME/.config/lxsession/LXDE-pi/autostart"

echo "=== Pi Dashboard Uninstall ==="

# ── nginx ─────────────────────────────────────────────────────────────────────
echo ">> Removing nginx site..."
sudo rm -f /etc/nginx/sites-enabled/pi-dashboard
sudo rm -f /etc/nginx/sites-available/pi-dashboard
sudo systemctl reload nginx

# ── Web root ──────────────────────────────────────────────────────────────────
echo ">> Removing web root..."
sudo rm -rf "$WEB_ROOT"

# ── Kiosk autostart ───────────────────────────────────────────────────────────
if [ -f "$AUTOSTART" ]; then
    rm "$AUTOSTART"
    echo ">> Removed kiosk autostart."
fi

echo ""
echo "=== Uninstall complete! ==="
