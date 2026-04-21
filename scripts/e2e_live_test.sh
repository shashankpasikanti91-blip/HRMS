#!/bin/bash
set -e
echo '=== SRP HRMS E2E Live Test ==='
PASS=0
FAIL=0

BASE="https://api.hrms.srpailabs.com"
WEB="https://app.hrms.srpailabs.com"

check() {
  local DESC="$1" CODE="$2" EXPECTED="$3"
  if [ "$CODE" = "$EXPECTED" ]; then
    echo "  PASS: $DESC ($CODE)"
    PASS=$((PASS+1))
  else
    echo "  FAIL: $DESC (got $CODE, expected $EXPECTED)"
    FAIL=$((FAIL+1))
  fi
}

# 1. Auth
RESP=$(curl -sf -X POST "$BASE/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.srpailabs.com","password":"Admin@1234"}')
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.srpailabs.com","password":"Admin@1234"}')
check "POST /api/v1/auth/login" "$CODE" "200"
TOKEN=$(echo "$RESP" | jq -r .access_token)

# 2. Employees list
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/employees?limit=5")
check "GET /api/v1/employees" "$S" "200"

# 3. Employee detail
EMP_RESP=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/employees?limit=1")
EMP_ID=$(echo "$EMP_RESP" | jq -r '.data[0].id // .[0].id // empty')
if [ -n "$EMP_ID" ]; then
  S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/employees/$EMP_ID")
  check "GET /api/v1/employees/{id} (id=$EMP_ID)" "$S" "200"
else
  echo "  WARN: no employee ID found, skipping detail check"
fi

# 4. Auth /me
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/auth/me")
check "GET /api/v1/auth/me" "$S" "200"

# 5. Attendance
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/attendance?limit=5")
check "GET /api/v1/attendance" "$S" "200"

# 6. Leave requests
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/leave/requests?limit=5")
echo "  INFO: GET /api/v1/leave/requests: $S"

# 7. Departments
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/departments")
echo "  INFO: GET /api/v1/departments: $S"

# 8. Web UI
S=$(curl -s -o /dev/null -w '%{http_code}' "$WEB/")
check "Web UI (/)" "$S" "200"

S=$(curl -s -o /dev/null -w '%{http_code}' "$WEB/dashboard/calendar")
echo "  INFO: GET /dashboard/calendar: $S"

echo ''
echo "=== RESULTS: $PASS passed, $FAIL failed ==="
