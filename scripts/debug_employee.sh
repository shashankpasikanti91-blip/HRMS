#!/bin/bash
echo '=== Debug employee detail with acme tenant ==='

# Login as acme user instead
TOKEN=$(curl -sf -X POST "https://api.hrms.srpailabs.com/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@acme.com","password":"Admin@1234"}' | jq -r .access_token 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Alice login failed, trying bob..."
  TOKEN=$(curl -sf -X POST "https://api.hrms.srpailabs.com/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"email":"bob@acme.com","password":"Admin@1234"}' | jq -r .access_token 2>/dev/null)
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Regular employee login failed - checking admin again..."
  TOKEN=$(curl -sf -X POST "https://api.hrms.srpailabs.com/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@demo.srpailabs.com","password":"Admin@1234"}' | jq -r .access_token)
fi

echo "Token OK"

# Try fetching different employee IDs
for EMP_ID in "17f714dd-aa55-4da8-bc00-2ed346b75c82" "02a3102c-9de5-4bb3-aa8e-d1a00f709666" "bebe0de5-ea78-40bf-bfb2-640c03d6c9e3"; do
  S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/employees/$EMP_ID")
  echo "GET /employees/$EMP_ID: $S"
done

# Check /me employee record
echo "-- /auth/me --"
curl -s -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/auth/me" | jq '{id, email, employee_id, role}'

echo ""
echo "-- /api/v1/leaves --"
curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com/api/v1/leaves"
echo ""
