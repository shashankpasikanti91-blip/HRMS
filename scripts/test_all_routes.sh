#!/bin/bash
TOKEN=$(curl -sf -X POST "https://api.hrms.srpailabs.com/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.srpailabs.com","password":"Admin@1234"}' | jq -r .access_token)
echo "Auth OK"
echo "-- API routes --"
for ROUTE in \
  "/notifications" \
  "/notifications?page_size=5" \
  "/leaves" \
  "/leaves?limit=5" \
  "/leave/balance" \
  "/leaves/balance" \
  "/attendance?limit=5" \
  "/payroll/runs" \
  "/analytics/dashboard" \
  "/departments" \
  "/performance/reviews" \
  "/documents" \
  "/holidays" \
  "/lop" \
  "/taxation" \
  "/system-logs" \
  "/settings"; do
  S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1$ROUTE")
  echo "$S  GET /api/v1$ROUTE"
done
