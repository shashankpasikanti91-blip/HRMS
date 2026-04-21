import urllib.request, json

BASE = "http://127.0.0.1:8003"

def get(url, token):
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token})
    try:
        r = urllib.request.urlopen(req)
        return json.loads(r.read()), r.getcode()
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read())
        except Exception:
            body = {}
        return {"error": e.reason, "detail": body}, e.code

# Login admin
req = urllib.request.Request(BASE + "/api/v1/auth/login",
    data=json.dumps({"email": "admin@demo.srpailabs.com", "password": "Admin@1234"}).encode(),
    headers={"Content-Type": "application/json"})
resp = json.loads(urllib.request.urlopen(req).read())
token = resp["access_token"]
user = resp.get("user", {})
print("Login admin@demo: OK role=" + user.get("role", "?") + " company_id=" + str(user.get("company_id")))

# Login superadmin
req2 = urllib.request.Request(BASE + "/api/v1/auth/login",
    data=json.dumps({"email": "superadmin@srpailabs.com", "password": "SrpAdmin@2026!"}).encode(),
    headers={"Content-Type": "application/json"})
resp2 = json.loads(urllib.request.urlopen(req2).read())
u2 = resp2.get("user", {})
print("Login superadmin: OK role=" + u2.get("role", "?"))

# API endpoints
endpoints = [
    ("/api/v1/employees/?page=1&size=5", "total"),
    ("/api/v1/attendance?page=1&size=5", "total"),
    ("/api/v1/analytics/dashboard", "total_employees"),
    ("/api/v1/leaves?page=1&size=5", "total"),
    ("/api/v1/payroll/runs?page=1&size=5", "meta"),
    ("/api/v1/performance/reviews?page=1&size=5", "total"),
    ("/api/v1/holidays?page=1&size=5", "total"),
]

for ep, key in endpoints:
    data, code = get(BASE + ep, token)
    if code == 200:
        val = data.get(key, list(data.keys())[:3]) if isinstance(data, dict) else type(data).__name__
        print("OK  " + ep + " -> " + str(val))
    else:
        print("ERR " + ep + " -> HTTP " + str(code) + " " + str(data.get("detail", data.get("error", "?"))))
