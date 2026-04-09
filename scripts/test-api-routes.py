import urllib.request, urllib.error, json

BASE = "https://api.hrms.srpailabs.com/api/v1"
TENANT = "a0000000-0000-4000-8000-000000000001"

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
        except:
            body2 = {}
        return e.code, body2

# Login and print full response structure
code, data = req("POST", "/auth/login", body={"email":"hr@demo.srpailabs.com","password":"Demo@2026!","tenantId":TENANT})
print(f"Login status: {code}")
print(f"Response keys: {list(data.keys())}")
if "tokens" in data:
    print(f"tokens sub-keys: {list(data['tokens'].keys())}")
tok = ""
if "tokens" in data and isinstance(data["tokens"], dict):
    tok = data["tokens"].get("accessToken", data["tokens"].get("access_token", ""))
elif "accessToken" in data:
    tok = data["accessToken"]
elif "access_token" in data:
    tok = data["access_token"]
print(f"token (chars 0-40): {tok[:40]}")
print()

if not tok:
    print("No token - full response:")
    print(json.dumps(data, indent=2)[:1000])
    exit()

# Test all routes with token
tests = [
    ("GET", "/users/me"),
    ("GET", "/auth/users/me"),
    ("GET", "/core-hr/employees"),
    ("GET", "/core-hr/departments"),
    ("GET", f"/analytics/dashboards/executive/{TENANT}"),
    ("GET", "/attendance"),
    ("GET", "/payroll"),
    ("GET", "/recruitment"),
    ("GET", "/performance"),
    ("GET", "/notification"),
    ("GET", "/core-hr/positions"),
]

for method, path in tests:
    code2, data2 = req(method, path, token=tok)
    if isinstance(data2, dict):
        keys = list(data2.keys())[:4]
    else:
        keys = f"list[{len(data2)}]"
    print(f"  {method} {path}: {code2} | {keys}")
