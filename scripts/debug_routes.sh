#!/bin/bash
echo '=== Debug employee endpoints ==='

TOKEN=$(curl -sf -X POST "https://api.hrms.srpailabs.com/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.srpailabs.com","password":"Admin@1234"}' | jq -r .access_token)

echo "-- Employee list response structure --"
curl -s -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/employees?limit=1" | jq '.'

echo ""
EMP_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/employees?limit=1" | jq -r '.data[0].id // .[0].id // empty')
echo "Employee ID: $EMP_ID"

echo "-- Testing /api/v1/employees/$EMP_ID --"
curl -s -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/employees/$EMP_ID" | jq '.'

echo "-- Testing /api/v1/employees/$EMP_ID/profile --"
curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/employees/$EMP_ID/profile"
echo ""

echo "-- Leave endpoints --"
for EP in "/api/v1/leave" "/api/v1/leaves" "/api/v1/leave-requests" "/api/v1/leave/balance"; do
  S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com$EP")
  echo "  GET $EP: $S"
done
