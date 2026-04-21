#!/bin/bash
TOKEN=$(curl -sf -X POST "https://api.hrms.srpailabs.com/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.srpailabs.com","password":"Admin@1234"}' | jq -r .access_token)

echo "=== Notifications ==="
curl -s -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/notifications?page_size=3" | jq '.'

echo "=== Performance ==="
curl -s -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/performance?page_size=3" | jq '.'

echo "=== System Logs ==="
curl -s -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/audit-logs?page_size=3" | head -10
curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/audit-logs"
echo " /audit-logs"

echo "=== All available routes ==="
curl -s "https://api.hrms.srpailabs.com/api/v1/" | jq '.' 2>/dev/null || echo "No index"
curl -s "https://api.hrms.srpailabs.com/openapi.json" 2>/dev/null | jq '.paths | keys[]' 2>/dev/null | head -40 || echo "No OpenAPI"
curl -s "http://localhost:8003/openapi.json" 2>/dev/null | jq '.paths | keys[]' 2>/dev/null | head -40 || echo "No local OpenAPI"
