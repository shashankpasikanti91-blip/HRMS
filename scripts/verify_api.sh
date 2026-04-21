#!/bin/bash
TOKEN=$(curl -sf -X POST "https://api.hrms.srpailabs.com/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.srpailabs.com","password":"Admin@1234"}' | jq -r .access_token)

echo "Testing employee detail with business_id..."
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/employees/EMP-ADMIN-60CFF0")
echo "GET /employees/EMP-ADMIN-60CFF0: $S"

S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/employees/EMP-000001")
echo "GET /employees/EMP-000001: $S"

S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/employees/ADMIN-60CFF0")
echo "GET /employees/ADMIN-60CFF0: $S"

echo ""
echo "Testing /api/v1/leaves endpoints..."
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/leaves?limit=5")
echo "GET /api/v1/leaves: $S"

echo ""
echo "Checking what the employee list returns for business_id..."
curl -s -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/employees?limit=2" | jq '[.data[] | {id, business_id, employee_code, full_name}]'
