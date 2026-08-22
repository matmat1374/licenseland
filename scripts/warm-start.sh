#!/bin/bash
# Starts the production server and pre-warms all routes to prevent OOM crashes.
# The sandbox has limited RAM — each new route causes a memory spike on first load.
# This script hits every route one by one so they're all cached in memory.

cd /home/z/my-project

# Kill any existing server
pkill -9 -f "next" 2>/dev/null
sleep 2

# Start production server
echo "[warm-start] Starting production server..."
setsid bash -c 'cd /home/z/my-project && exec npx next start -p 3000' < /dev/null > /dev/null 2>&1 &
SERVER_PID=$!
echo "[warm-start] Server PID: $SERVER_PID"

# Wait for server to be ready
echo "[warm-start] Waiting for server..."
for i in $(seq 1 20); do
  if ss -ltn 2>/dev/null | grep -q 3000; then
    echo "[warm-start] Server is UP"
    break
  fi
  sleep 1
done

# Pre-warm static pages
echo "[warm-start] Pre-warming routes..."
ROUTES=(
  "/"
  "/login"
  "/register"
  "/shop"
  "/blog"
  "/faq"
  "/about"
  "/contact"
  "/terms"
  "/privacy"
  "/cart"
  "/checkout"
  "/api/auth/csrf"
  "/api/auth/providers"
  "/api/products"
)

for route in "${ROUTES[@]}"; do
  CODE=$(curl -s --max-time 90 -o /dev/null -w "%{http_code}" "http://localhost:3000${route}")
  echo "[warm-start] ${route} -> ${CODE}"
  sleep 2
  if ! ss -ltn 2>/dev/null | grep -q 3000; then
    echo "[warm-start] WARNING: Server died on ${route}, restarting..."
    pkill -9 -f "next" 2>/dev/null
    sleep 3
    setsid bash -c 'cd /home/z/my-project && exec npx next start -p 3000' < /dev/null > /dev/null 2>&1 &
    sleep 10
  fi
done

# Pre-warm dynamic auth routes (these need special handling)
echo "[warm-start] Pre-warming auth routes..."

# Get CSRF token
rm -f /tmp/warm-cookies.txt
CSRF=$(curl -s --max-time 90 "http://localhost:3000/api/auth/csrf" -c /tmp/warm-cookies.txt | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
sleep 3

# Test OTP (creates a test user)
curl -s --max-time 90 -X POST "http://localhost:3000/api/auth/otp" \
  -H "Content-Type: application/json" \
  -d '{"phone":"09120000001","otp":"123456"}' > /dev/null
sleep 3

# Login
curl -s --max-time 90 -H "Content-Type: application/x-www-form-urlencoded" \
  -b /tmp/warm-cookies.txt -c /tmp/warm-cookies.txt \
  -X POST "http://localhost:3000/api/auth/callback/credentials" \
  -d "identifier=09120000001&password=123456&csrfToken=${CSRF}&json=true" > /dev/null
sleep 3

# Pre-warm authenticated routes
AUTH_ROUTES=(
  "/dashboard"
  "/dashboard?tab=orders"
  "/dashboard?tab=licenses"
  "/dashboard?tab=profile"
  "/admin"
  "/admin/products"
  "/admin/licenses"
  "/admin/orders"
  "/admin/articles"
  "/admin/discounts"
  "/admin/settings"
  "/admin/supplier"
  "/admin/debug"
)

for route in "${AUTH_ROUTES[@]}"; do
  CODE=$(curl -s --max-time 90 -b /tmp/warm-cookies.txt -o /dev/null -w "%{http_code}" "http://localhost:3000${route}")
  echo "[warm-start] ${route} -> ${CODE}"
  sleep 3
  if ! ss -ltn 2>/dev/null | grep -q 3000; then
    echo "[warm-start] WARNING: Server died on ${route}, restarting..."
    pkill -9 -f "next" 2>/dev/null
    sleep 3
    setsid bash -c 'cd /home/z/my-project && exec npx next start -p 3000' < /dev/null > /dev/null 2>&1 &
    sleep 10
    # Re-login
    rm -f /tmp/warm-cookies.txt
    CSRF=$(curl -s --max-time 90 "http://localhost:3000/api/auth/csrf" -c /tmp/warm-cookies.txt | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
    sleep 2
    curl -s --max-time 90 -H "Content-Type: application/x-www-form-urlencoded" \
      -b /tmp/warm-cookies.txt -c /tmp/warm-cookies.txt \
      -X POST "http://localhost:3000/api/auth/callback/credentials" \
      -d "identifier=09120000001&password=123456&csrfToken=${CSRF}&json=true" > /dev/null
    sleep 2
  fi
done

echo "[warm-start] All routes warmed up!"
echo "[warm-start] Server is ready at http://localhost:3000"
free -m | head -2
