#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${RAILWAY_SERVICE_NAME:-}"

if [[ "$SERVICE_NAME" == "backend" ]]; then
  cd back-end
  exec npm run start
fi

if [[ "$SERVICE_NAME" == "frontend" ]]; then
  cd front-end
  exec npm run start
fi

echo "Unknown RAILWAY_SERVICE_NAME='$SERVICE_NAME'. Expected 'backend' or 'frontend'."
exit 1
