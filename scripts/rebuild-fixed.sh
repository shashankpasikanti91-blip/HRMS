#!/bin/bash
cd /opt/srp-hrms/infrastructure/docker
ENVFILE=/opt/srp-hrms/.env.production
LOG=/opt/srp-hrms/rebuild.log

echo "Rebuild started at $(date)" > "$LOG"

for svc in api-gateway web; do
  echo "=== Building $svc at $(date) ===" >> "$LOG"
  docker compose -f docker-compose.prod.yml --env-file "$ENVFILE" build "$svc" >> "$LOG" 2>&1
  RC=$?
  if [ $RC -eq 0 ]; then
    echo "  $svc SUCCESS" >> "$LOG"
  else
    echo "  $svc FAILED (exit $RC)" >> "$LOG"
  fi
done

echo "Rebuild finished at $(date)" >> "$LOG"
echo "DONE" >> "$LOG"
