#!/bin/bash
echo '=== Finding correct API routes ==='

# Try different auth endpoints
for AUTH_EP in "/auth/login" "/api/v1/auth/login" "/api/auth/login"; do
  RESP=$(curl -sf -X POST "https://api.hrms.srpailabs.com$AUTH_EP" \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@demo.srpailabs.com","password":"Admin@1234"}' 2>/dev/null)
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "https://api.hrms.srpailabs.com$AUTH_EP" \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@demo.srpailabs.com","password":"Admin@1234"}' 2>/dev/null)
  echo "POST $AUTH_EP: $CODE"
  if [ "$CODE" = "200" ]; then
    TOKEN=$(echo "$RESP" | jq -r '.access_token // .token // empty' 2>/dev/null)
    if [ -n "$TOKEN" ]; then
      echo "  => Got token (${#TOKEN} chars)"
      # Test employee endpoints with this token
      for EMP_EP in "/employees" "/api/employees" "/api/v1/employees" "/v1/employees"; do
        S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "https://api.hrms.srpailabs.com$EMP_EP?limit=1")
        echo "  GET $EMP_EP: $S"
      done
    fi
  fi
done

# Check what's actually at port 8003 directly
echo ''
echo '=== Port 8003 direct routes ==='
curl -s "http://localhost:8003/openapi.json" | jq '.paths | keys[]' 2>/dev/null | head -20 || echo "No OpenAPI at 8003"
curl -s "http://localhost:8003/docs" | head -5 | grep -o 'title[^<]*' || echo "No docs at 8003"
