"""Public-key negatives only; no confirmed Auth/JWT positive-flow claim."""
import json
import pathlib
import secrets
import sys
import urllib.error
import urllib.request

connection = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8-sig"))
assert connection["projectRef"] == "wkdvdzfkbwvhyjmamrsg"
assert connection["url"] == "https://wkdvdzfkbwvhyjmamrsg.supabase.co"
results = []


def request(label, path, body=None, headers=None, expected=(401, 403, 404, 406)):
    request_headers = {"apikey": connection["publishableKey"]}
    request_headers.update(headers or {})
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        request_headers["Content-Type"] = "application/json"
    req = urllib.request.Request(connection["url"] + path, data, request_headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            status, raw = response.status, response.read()
    except urllib.error.HTTPError as error:
        status, raw = error.code, error.read()
    decoded = json.loads(raw)
    assert status in expected, (label, status)
    # No headers, bodies, passwords, keys, or tokens in the receipt.
    results.append({"check": label, "status": status, "code": decoded.get("code") or decoded.get("error_code"), "passed": True})
    return decoded


settings = request("Auth settings", "/auth/v1/settings", expected=(200,))
assert settings["external"]["email"] is True
assert settings["external"]["anonymous_users"] is False
assert settings["disable_signup"] is False
assert settings["mailer_autoconfirm"] is False
for table in ("wallets", "travelers", "inventory"):
    request("anon cannot read " + table, "/rest/v1/" + table + "?select=*")
for schema in ("economy_private", "story_private", "guild_ops", "ebd_ops", "guild_invite_private", "guild_chat_private"):
    response = request("private schema not exposed: " + schema, "/rest/v1/wallets?select=*", headers={"Accept-Profile": schema}, expected=(406,))
    assert response["code"] == "PGRST106"
for rpc, body in (
    ("add_coins", {"p_traveler_id": "d0021000-0000-4000-8000-000000000001", "p_amount": 999}),
    ("arena_authority_v3", {"p_user": "d0020000-0000-4000-8000-000000000001", "p_traveler": "d0021000-0000-4000-8000-000000000001", "p_operation": "commit", "p_payload": {"coins": 999}}),
):
    request("anon RPC denied: " + rpc, "/rest/v1/rpc/" + rpc, body)
invalid = {"Authorization": "Bearer deliberately.invalid.jwt"}
request("invalid JWT Auth user", "/auth/v1/user", headers=invalid)
request("invalid JWT REST", "/rest/v1/wallets?select=*", headers=invalid)
response = request("anonymous signup disabled", "/auth/v1/signup", {}, expected=(400, 422))
assert response.get("error_code") == "anonymous_provider_disabled"
response = request("nonexistent email password rejected", "/auth/v1/token?grant_type=password", {"email": "deploy002-never-created@fixture.invalid", "password": secrets.token_urlsafe(48)}, expected=(400,))
assert response.get("error_code") == "invalid_credentials"
out = {"projectRef": connection["projectRef"], "passed": True, "checks": results, "authSettingsVerifiedNotChanged": True, "realConfirmedJwtTested": False}
pathlib.Path(sys.argv[2]).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"passed": True, "checks": len(results), "realConfirmedJwtTested": False}))
