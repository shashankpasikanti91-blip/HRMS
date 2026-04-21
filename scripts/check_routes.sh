#!/bin/bash
set -e
echo '=== Checking API routes ==='

TOKEN=$(curl -sf -X POST "https://api.hrms.srpailabs.com/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.srpailabs.com","password":"Admin@1234"}' | jq -r .access_token)
echo "Auth: OK"

# Try various route prefixes
for ROUTE in "/employees" "/api/employees" "/api/v1/employees" "/v1/employees"; do
  S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com$ROUTE?limit=1")
  echo "GET $ROUTE: $S"
done

# Check OpenAPI docs
S=$(curl -s -o /dev/null -w '%{http_code}' "https://api.hrms.srpailabs.com/docs")
echo "GET /docs: $S"
S=$(curl -s -o /dev/null -w '%{http_code}' "https://api.hrms.srpailabs.com/openapi.json")
echo "GET /openapi.json: $S"

# Check /health
S=$(curl -sf "https://api.hrms.srpailabs.com/health")
echo "Health: $S"
