#!/usr/bin/env bash
# ============================================================
# Painel DEPAD — Smoke Test Script
# Validates lint, types, build, and critical route availability.
# Usage:
#   ./scripts/smoke-test.sh          # full suite (build + routes)
#   ./scripts/smoke-test.sh --quick  # lint + types only (no server)
# ============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color
PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); echo -e "  ${GREEN}✓${NC} $1"; }
fail() { FAIL=$((FAIL + 1)); echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${YELLOW}→${NC} $1"; }

echo ""
echo "═══════════════════════════════════════════════"
echo "  Painel DEPAD — Smoke Test"
echo "═══════════════════════════════════════════════"
echo ""

# ── 1. LINT ──────────────────────────────────────
echo "▸ Lint"
if npm run lint --silent 2>/dev/null; then
  pass "ESLint passed"
else
  fail "ESLint failed"
fi

# ── 2. TYPE CHECK ────────────────────────────────
echo "▸ Type Check"
if npx tsc --noEmit 2>/dev/null; then
  pass "TypeScript passed (tsc --noEmit)"
else
  fail "TypeScript errors found"
fi

# ── 3. GIT DIFF CHECK ───────────────────────────
echo "▸ Git Hygiene"
if git diff --check HEAD 2>/dev/null; then
  pass "No whitespace errors (git diff --check)"
else
  fail "Whitespace issues detected"
fi

# ── Quick mode exits here ────────────────────────
if [[ "${1:-}" == "--quick" ]]; then
  echo ""
  echo "═══════════════════════════════════════════════"
  echo -e "  Quick mode: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}"
  echo "═══════════════════════════════════════════════"
  [[ $FAIL -eq 0 ]] && exit 0 || exit 1
fi

# ── 4. BUILD ─────────────────────────────────────
echo "▸ Production Build"
if npm run build --silent 2>/dev/null; then
  pass "next build succeeded"
else
  fail "next build failed"
fi

# ── 5. ROUTE SMOKE (start server, check routes, kill) ──
echo "▸ Route Availability"
PORT=3999
info "Starting server on port ${PORT}..."
PORT=$PORT npm run start &>/dev/null &
SERVER_PID=$!

# Wait for the server to be ready (max 20s)
for i in $(seq 1 20); do
  if curl -s -o /dev/null -w '' http://localhost:$PORT/ 2>/dev/null; then
    break
  fi
  sleep 1
done

ROUTES=(
  "/dashboard"
  "/dashboard/contratos"
  "/dashboard/mops"
  "/api/dashboard/geral"
  "/api/dashboard/contratos"
  "/api/dashboard/mops"
)

for route in "${ROUTES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}${route}" 2>/dev/null || echo "000")
  if [[ "$STATUS" == "200" || "$STATUS" == "307" || "$STATUS" == "302" ]]; then
    pass "${route} → ${STATUS}"
  else
    fail "${route} → ${STATUS}"
  fi
done

# Clean up
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

# ── SUMMARY ──────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo -e "  Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}"
echo "═══════════════════════════════════════════════"
echo ""

[[ $FAIL -eq 0 ]] && exit 0 || exit 1
