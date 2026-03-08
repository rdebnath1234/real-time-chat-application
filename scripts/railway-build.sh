#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${RAILWAY_SERVICE_NAME:-}"

if [[ "$SERVICE_NAME" == "backend" ]]; then
  cd back-end
  npm ci
  echo "Backend build step complete."
  exit 0
fi

if [[ "$SERVICE_NAME" == "frontend" ]]; then
  cd front-end
  npm ci
  npm run build
  echo "Frontend build step complete."
  exit 0
fi

echo "Unknown RAILWAY_SERVICE_NAME='$SERVICE_NAME'. Expected 'backend' or 'frontend'."
exit 1
