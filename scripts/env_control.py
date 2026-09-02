#!/usr/bin/env python3
"""Validate and safely change non-secret deployment controls without printing secrets."""

from __future__ import annotations

import argparse
import ipaddress
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"


def parse_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key] = value
    return values


def truthy(value: str | None) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def public_https_address(value: str) -> bool:
    address = value.strip()
    if not address or address == ":80" or address.startswith("http://"):
        return False
    host = re.sub(r"^https://", "", address).split("/", 1)[0].split(":", 1)[0]
    if host.lower() in {"localhost", "127.0.0.1", "::1"}:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        return "." in host and all(part for part in host.split("."))


def validate(values: dict[str, str], proposed_master: bool | None = None) -> list[str]:
    errors: list[str] = []
    required_accounts = ["ADMIN_USERNAME", "ADMIN_PASSWORD", "PLANNER_USERNAME", "PLANNER_PASSWORD"]
    for key in required_accounts:
        if not values.get(key):
            errors.append(f"{key} must be configured.")
    for key in ("ADMIN_PASSWORD", "PLANNER_PASSWORD"):
        password = values.get(key, "")
        if password and len(password) < 12:
            errors.append(f"{key} must contain at least 12 characters.")
    if values.get("ADMIN_USERNAME") and values.get("ADMIN_USERNAME") == values.get("PLANNER_USERNAME"):
        errors.append("Admin and Planner usernames must be different.")
    if values.get("ADMIN_PASSWORD") and values.get("ADMIN_PASSWORD") == values.get("PLANNER_PASSWORD"):
        errors.append("Admin and Planner passwords must be different.")

    master = proposed_master if proposed_master is not None else truthy(values.get("AI_FEATURE_ALLOWED"))
    if master:
        if values.get("AI_OBSERVABILITY_MODE") != "live":
            errors.append("AI_OBSERVABILITY_MODE must be live before allowing AI generation.")
        if not truthy(values.get("AI_REQUIRE_HTTPS", "true")):
            errors.append("AI_REQUIRE_HTTPS must remain true for an AWS live-AI demonstration.")
        if not public_https_address(values.get("SITE_ADDRESS", "")):
            errors.append("SITE_ADDRESS must be a DNS hostname for Caddy HTTPS before allowing AI generation on AWS.")
        for key in ("OPENAI_API_KEY", "LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY"):
            if not values.get(key):
                errors.append(f"{key} must be configured before allowing AI generation.")
    return errors


def update_value(path: Path, key: str, value: str) -> None:
    lines = path.read_text(encoding="utf-8").splitlines() if path.exists() else []
    pattern = re.compile(rf"^\s*{re.escape(key)}\s*=")
    replacement = f"{key}={value}"
    found = False
    output: list[str] = []
    for line in lines:
        if pattern.match(line) and not found:
            output.append(replacement)
            found = True
        elif pattern.match(line):
            continue
        else:
            output.append(line)
    if not found:
        if output and output[-1].strip():
            output.append("")
        output.extend(["# Admin-controlled AI environment master", replacement])
    temp = path.with_suffix(".tmp")
    temp.write_text("\n".join(output).rstrip() + "\n", encoding="utf-8")
    try:
        os.chmod(temp, 0o600)
    except OSError:
        pass
    os.replace(temp, path)
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass


def print_errors(errors: list[str]) -> None:
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)


def status(values: dict[str, str]) -> None:
    master = truthy(values.get("AI_FEATURE_ALLOWED"))
    print(f"Site address: {values.get('SITE_ADDRESS') or '(not configured)'}")
    print(f"Accounts configured: {'yes' if all(values.get(k) for k in ('ADMIN_USERNAME','ADMIN_PASSWORD','PLANNER_USERNAME','PLANNER_PASSWORD')) else 'no'}")
    print(f"Planner quick login: {'enabled' if truthy(values.get('DEMO_QUICK_LOGIN')) else 'disabled'}")
    print(f"AI mode: {values.get('AI_OBSERVABILITY_MODE') or 'mock'}")
    print(f"AI environment master: {'ALLOWED' if master else 'LOCKED'}")
    print(f"HTTPS required: {'yes' if truthy(values.get('AI_REQUIRE_HTTPS','true')) else 'no'}")
    print(f"OpenAI configured: {'yes' if bool(values.get('OPENAI_API_KEY')) else 'no'}")
    print(f"Langfuse configured: {'yes' if bool(values.get('LANGFUSE_PUBLIC_KEY') and values.get('LANGFUSE_SECRET_KEY')) else 'no'}")
    print("Secret values are not displayed.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["validate", "status", "migrate", "allow", "lock"])
    parser.add_argument("--env-file", type=Path, default=ENV_FILE)
    args = parser.parse_args()
    path = args.env_file.resolve()
    if not path.exists():
        print(f"ERROR: Missing {path}. Copy .env.example to .env first.", file=sys.stderr)
        return 1
    values = parse_env(path)

    if args.command == "status":
        status(values)
        return 0
    if args.command == "migrate":
        added: list[str] = []
        if "DEMO_QUICK_LOGIN" not in values:
            update_value(path, "DEMO_QUICK_LOGIN", "true")
            added.append("DEMO_QUICK_LOGIN=true")
        if added:
            print("Added missing non-secret release controls: " + ", ".join(added))
        else:
            print("No environment migration required.")
        print("Existing account, provider and AI control values were not changed or displayed.")
        return 0
    if args.command == "lock":
        update_value(path, "AI_FEATURE_ALLOWED", "false")
        print("AI environment master set to LOCKED. No secret values were changed.")
        return 0
    if args.command == "allow":
        errors = validate(values, proposed_master=True)
        if errors:
            print_errors(errors)
            print("AI environment master remains unchanged.", file=sys.stderr)
            return 1
        update_value(path, "AI_FEATURE_ALLOWED", "true")
        print("AI environment master set to ALLOWED. Runtime access will still start OFF.")
        return 0

    errors = validate(values)
    if errors:
        print_errors(errors)
        return 1
    print("Environment validation passed. Secret values were not displayed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
