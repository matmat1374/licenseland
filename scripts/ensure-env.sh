#!/bin/bash
# Ensures .env has all required variables before server starts.
# Safe to run multiple times — overwrites with correct values.
ENV_FILE="/home/z/my-project/.env"

# Don't overwrite DATABASE_URL if it already exists (production may use a different URL)
EXISTING_DB_URL=""
if [ -f "$ENV_FILE" ]; then
  EXISTING_DB_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2-)
fi
if [ -z "$EXISTING_DB_URL" ]; then
  EXISTING_DB_URL="file:/home/z/my-project/db/custom.db"
fi

cat > "$ENV_FILE" << ENV
DATABASE_URL=$EXISTING_DB_URL

# NextAuth — stable secret (also hardcoded in code as fallback)
NEXTAUTH_SECRET=licenseland-prod-secret-9f3a7b2c8e1d4a6f0c5b3e7a2d9f1c4e

# ZarinPal — empty = DEMO mode (simulated payment)
ZARINPAL_MERCHANT=
ZARINPAL_SANDBOX=true

# Telegram supplier bot (optional, configurable in admin panel)
TELEGRAM_BOT_TOKEN=
TELEGRAM_SUPPLIER_CHAT_ID=

# Supplier API (irMarket) — also configurable in admin settings
SUPPLIER_API_URL=
SUPPLIER_API_KEY=
SUPPLIER_MARKUP_PERCENT=200
ENV

echo "[ensure-env] .env written (DATABASE_URL=$EXISTING_DB_URL)"
