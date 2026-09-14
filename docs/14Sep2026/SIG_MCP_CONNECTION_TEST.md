# Testing the SIG MCP connection and capturing the tool contract

**Prepared:** 14 September 2026

**Endpoint:** `https://servirplatform.sig-gis.com/mcp`

**Closes:** P0 item 2 of `docs/10Sep2026/PROTOTYPE_ARCHITECTURE_ALIGNMENT_REVIEW.md` —
*"Confirm the deployed SIG schemas… The supplied screenshots are not a contract test."*

## Why this exists

Until now the repository's only evidence for the SIG MCP server was a set of
staging screenshots and a tester's recollection of 15 tools. That claim is
hard-coded in `backend/prototype-service.js` (`mcpTools()`), and nothing in the
repository can tell whether it still matches the deployed server.

`scripts/sig-mcp-capture.js` replaces that with a recorded, re-runnable
contract capture, and diffs the live inventory against what the prototype
claims.

## Prerequisites

- Node 18 or newer (`node --version`). No `npm install` — the script uses only
  Node builtins, like the rest of this repository.
- A network that can reach `servirplatform.sig-gis.com:443`. Corporate proxies
  frequently block it; see *Troubleshooting*.
- A browser signed in to the invited Google account.

## Step 1 — Check reachability and auth requirements

No login, no data written beyond the metadata file:

```bash
node scripts/sig-mcp-capture.js --discover-only
```

A reachable, correctly configured MCP server answers:

```text
unauthenticated initialize → HTTP 401 (authorization required, as expected)
protected-resource metadata: https://servirplatform.sig-gis.com/.well-known/oauth-protected-resource/mcp
authorization server: …
```

## Step 2 — Authenticate and capture the tool contract

```bash
node scripts/sig-mcp-capture.js
```

The script:

1. discovers the protected-resource and authorization-server metadata;
2. registers a client dynamically when the server advertises it
   (otherwise pass `--client-id`);
3. opens the consent page — **you** sign in with the invited Google account;
4. completes an OAuth 2.1 authorization-code exchange with PKCE (S256) on a
   local `http://localhost:8765/callback` listener;
5. runs the MCP `initialize` handshake and records the negotiated protocol
   version, server info and capabilities;
6. enumerates every tool, following `nextCursor` pagination, and records each
   tool's full `inputSchema`, `outputSchema` and annotations;
7. writes `docs/<DDMonYYYY>/sig-mcp-capture.json` and prints a diff against the
   prototype's claimed inventory.

Useful flags:

| Flag | Purpose |
|---|---|
| `--endpoint <url>` | Target a different deployment |
| `--out <file>` | Write the evidence file somewhere specific |
| `--port <number>` | Change the local callback port if 8765 is taken |
| `--client-id <id>` | Use a pre-registered client instead of dynamic registration |
| `--scope <scopes>` | Request specific scopes |
| `--discover-only` | Metadata only; no login and no tool list |

## Step 3 — Read the diff

The run ends with a comparison against `mcpTools()` in
`backend/prototype-service.js`:

```text
Against this prototype's claimed inventory:
  claimed 15 · live 15 · confirmed 14
  CLAIMED BUT NOT ON SERVER: ui_embed
  ON SERVER BUT NOT CLAIMED: risk_brief
```

- **CLAIMED BUT NOT ON SERVER** — the prototype advertises a tool the server no
  longer exposes. Correct the fixture; the Admin staging rehearsal is telling
  reviewers something untrue.
- **ON SERVER BUT NOT CLAIMED** — new upstream capability. Check whether it
  changes the `grp-flood` connector plan before adding it.

Commit `sig-mcp-capture.json` next to this file. It is the contract record the
architecture review asked for, and re-running the script later shows drift.

## What this does and does not prove

Proves:

- the server is reachable and enforces authorization;
- the invited account can authenticate and open a session;
- the exact protocol version, server identity and advertised tool surface,
  with full argument schemas.

Does **not** prove:

- that a Risk or `grp-flood` connector exists — enumeration is not connection;
- that a protected evidence transfer or privacy gate works;
- that any tool returns correct or scientifically approved results;
- anything about `compute_run` or `contribute_submit` beyond their absence or
  presence in the list.

Those remain P0 items 1 and 3–7 of the architecture review.

## Security notes

- No access token is persisted. Every run performs a fresh authorization; the
  browser's Google session makes that a single click.
- The evidence file records the `client_id`, requested scope and tool schemas
  only. No token, no refresh token, no account identifier.
- The script never calls a tool, so it cannot transfer or expose SIG data.
- Review the evidence file before committing, as with any captured artefact.

## Troubleshooting

**`HTTP 403` with the proxy warning.** The script prints an explicit warning
when it receives a 403 carrying no `WWW-Authenticate` challenge, because that
is almost always an egress proxy refusing the host rather than the server
asking you to sign in. Confirm with:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://servirplatform.sig-gis.com/mcp
```

If that fails from your network but the endpoint works elsewhere, it is a
firewall or proxy allowlist question for your IT contact, not a server fault.

**`Timed out waiting for the browser callback.`** The consent page never
returned to `localhost`. Check that port 8765 is free (`--port` to change it)
and that the redirect URI the server registered matches.

**`No client_id available.`** The authorization server does not offer dynamic
registration. Ask the SIG team to register a client for this repository and
pass it with `--client-id`.

**Cloud Claude Code sessions cannot run this.** The hosted environment's egress
policy does not include `servirplatform.sig-gis.com`, and the OAuth consent has
to happen in your own browser. Run it on your own machine.

## Alternative quick checks

To eyeball the tools without producing an evidence file:

```bash
# Official MCP Inspector — browser UI, handles OAuth, shows full schemas
npx @modelcontextprotocol/inspector

# Or register the server with the Claude Code CLI, then run /mcp to sign in
claude mcp add --transport http servir-sig https://servirplatform.sig-gis.com/mcp
```

Neither records committable evidence or diffs against the prototype's claims,
so use `scripts/sig-mcp-capture.js` for anything that needs to be cited.
