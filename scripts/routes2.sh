#!/bin/bash
TOKEN=$(curl -sf -X POST "https://api.hrms.srpailabs.com/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.srpailabs.com","password":"Admin@1234"}' | jq -r .access_token)
echo "Token: OK"

curl -s -o /dev/null -w '%{http_code}' -X PUT -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/notifications/read-all"
echo " PUT /notifications/read-all"

curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/employees/me"
echo " GET /employees/me"

curl -s -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/auth/me" | jq '.'
echo "auth/me output"

curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/leaves/balance"
echo " GET /leaves/balance"

curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/lop/policy"
echo " GET /lop/policy"

curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/lop/records"
echo " GET /lop/records"

curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/taxation/summary"
echo " GET /taxation/summary"

curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/settings"
echo " GET /settings"
