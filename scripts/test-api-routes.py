"""
Quick smoke-test for the FastAPI backend.
Tests auth + core routes to verify endpoints are reachable.

Usage:
    python scripts/test-api-routes.py
"""

import urllib.request, urllib.error, json, sys

BASE = "https://api.hrms.srpailabs.com/api/v1"

def req(method, url, token=None, body=None):
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    r = urllib.request.Request(BASE + url, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            body2 = json.loads(e.read())
        except Exception:
            body2 = {}
        return e.code, body2

# Login
code, data = req("POST", "/auth/login", body={
    "email": "admin@demo.srpailabs.com",
    "password": "Admin@1234",
})
print(f"Login: {code}")
tok = data.get("access_token", "")
if not tok:
    print("No token received. Response:")
    print(json.dumps(data, indent=2)[:500])
    sys.exit(1)
print(f"Token: {tok[:40]}...\n")

# Routes to test
tests = [
    ("GET",  "/auth/me"),
    ("GET",  "/employees"),
    ("GET",  "/departments"),
    ("GET",  "/attendance"),
    ("GET",  "/leaves"),
    ("GET",  "/payroll/payslips"),
    ("GET",  "/holidays"),
    ("GET",  "/analytics/dashboard"),
    ("GET",  "/search?q=test"),
    ("GET",  "/audit-logs"),
]

passed, failed = 0, 0
for method, path in tests:
    code2, data2 = req(method, path, token=tok)
    status = "OK" if code2 < 400 else "FAIL"
    if status == "OK":
        passed += 1
    else:
        failed += 1
    summary = ""
    if isinstance(data2, dict):
        summary = str(list(data2.keys())[:3])
    elif isinstance(data2, list):
        summary = f"list[{len(data2)}]"
    print(f"  [{status}] {method} {path}: {code2} {summary}")

print(f"\nDone: {passed} passed, {failed} failed out of {len(tests)} tests")
