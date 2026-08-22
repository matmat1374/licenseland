#!/bin/bash
# Ensures .env has all required variables (prevents auth breakage when .env gets wiped).
ENV_FILE="/home/z/my-project/.env"

ensure_key() {
  local key="$1"
  local value="$2"
  if ! grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    echo "" >> "$ENV_FILE"
    echo "${key}=${value}" >> "$ENV_FILE"
    echo "[env-guard] Added missing ${key}"
  fi
}

if [ ! -f "$ENV_FILE" ]; then
  echo "DATABASE_URL=file:/home/z/my-project/db/custom.db" > "$ENV_FILE"
fi

ensure_key "DATABASE_URL" "file:/home/z/my-project/db/custom.db"
ensure_key "NEXTAUTH_SECRET" "licenseland-prod-secret-9f3a7b2c8e1d4a6f0c5b3e7a2d9f1c4e"
ensure_key "ZARINPAL_SANDBOX" "true"
ensure_key "SUPPLIER_MARKUP_PERCENT" "200"

echo "[env-guard] .env OK"
