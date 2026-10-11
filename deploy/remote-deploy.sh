#!/usr/bin/env bash
# ============================================================================
# Runs ON the EC2 host (invoked over SSH by the deploy job). Pulls the images
# tagged with the given SHA, rolls the stack, smoke-tests /api/health, and rolls
# back to the last known-good tag if the smoke test fails.
#
# Required env (passed over SSH):
#   IMAGE_TAG  GHCR_USER  GHCR_TOKEN
# Expects: ~/voting/docker-compose.prod.yml and ~/voting/.env already present.
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

: "${IMAGE_TAG:?IMAGE_TAG is required}"
: "${GHCR_USER:?GHCR_USER is required}"
: "${GHCR_TOKEN:?GHCR_TOKEN is required}"

COMPOSE="docker compose -f docker-compose.prod.yml"
LAST_GOOD_FILE=".last_good_tag"

echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin

roll() {
  local tag="$1"
  echo ">> Rolling out IMAGE_TAG=${tag}"
  IMAGE_TAG="${tag}" $COMPOSE pull
  IMAGE_TAG="${tag}" $COMPOSE up -d --remove-orphans
}

smoke() {
  echo ">> Smoke-testing /api/health via the web container ..."
  for i in $(seq 1 20); do
    code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/api/health || true)
    echo "   attempt $i -> HTTP $code"
    [ "$code" = "200" ] && return 0
    sleep 5
  done
  return 1
}

roll "${IMAGE_TAG}"

if smoke; then
  echo "${IMAGE_TAG}" > "${LAST_GOOD_FILE}"
  echo ">> Deploy OK. Marked ${IMAGE_TAG} as last-good."
  docker image prune -f >/dev/null 2>&1 || true
  docker logout ghcr.io >/dev/null 2>&1 || true
  $COMPOSE ps
else
  echo "!! Smoke test failed."
  if [ -f "${LAST_GOOD_FILE}" ]; then
    prev="$(cat "${LAST_GOOD_FILE}")"
    echo "!! Rolling back to last-good tag: ${prev}"
    roll "${prev}"
    docker logout ghcr.io >/dev/null 2>&1 || true
  fi
  exit 1
fi
