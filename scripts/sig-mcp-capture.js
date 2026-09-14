#!/usr/bin/env node
/*
 * SIG MCP contract capture.
 *
 * Runs on a machine that can reach the SERVIR SIG MCP server and that has a
 * browser for the invited Google account. It authenticates with OAuth 2.1
 * (PKCE + dynamic client registration when advertised), performs the MCP
 * initialize handshake, enumerates every tool with its full input schema, and
 * writes a committable evidence file.
 *
 * It then diffs the live inventory against the tool list this prototype claims
 * in backend/prototype-service.js, so the repository stops relying on
 * screenshots as its only integration evidence.
 *
 * No access token is ever written to the evidence file and no token is
 * persisted to disk.
 *
 *   node scripts/sig-mcp-capture.js
 *   node scripts/sig-mcp-capture.js --endpoint https://servirplatform.sig-gis.com/mcp
 *   node scripts/sig-mcp-capture.js --out docs/14Sep2026/sig-mcp-capture.json
 *   node scripts/sig-mcp-capture.js --discover-only   # no login, metadata only
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');

const DEFAULT_ENDPOINT = 'https://servirplatform.sig-gis.com/mcp';
const PROTOCOL_VERSION = '2025-06-18';
const CLIENT_NAME = 'servir-grp-demo-contract-capture';
const REQUEST_TIMEOUT_MS = 30000;

function parseArgs(argv) {
  const args = {endpoint: DEFAULT_ENDPOINT, out: '', port: 8765, clientId: '', scope: '', discoverOnly: false};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = () => argv[++i];
    if (key === '--endpoint') args.endpoint = next();
    else if (key === '--out') args.out = next();
    else if (key === '--port') args.port = Number(next());
    else if (key === '--client-id') args.clientId = next();
    else if (key === '--scope') args.scope = next();
    else if (key === '--discover-only') args.discoverOnly = true;
    else if (key === '--help' || key === '-h') { printHelp(); process.exit(0); }
    else { console.error(`Unknown argument: ${key}`); printHelp(); process.exit(2); }
  }
  return args;
}

function printHelp() {
  console.log(`
Capture the deployed SIG MCP tool contract.

  --endpoint <url>    MCP endpoint (default ${DEFAULT_ENDPOINT})
  --out <file>        Evidence JSON path (default docs/<DDMonYYYY>/sig-mcp-capture.json)
  --port <number>     Local OAuth callback port (default 8765)
  --client-id <id>    Pre-registered client ID; skips dynamic registration
  --scope <scopes>    Space-separated scopes to request
  --discover-only     Record discovery metadata only; no login, no tool list
`);
}

function defaultOutPath() {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const folder = `${String(now.getDate()).padStart(2, '0')}${months[now.getMonth()]}${now.getFullYear()}`;
  return path.join('docs', folder, 'sig-mcp-capture.json');
}

/* ---------------------------------------------------------------- helpers */

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function fetchJson(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {...init, signal: controller.signal});
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return {ok: response.ok, status: response.status, headers: response.headers, body, text};
  } finally {
    clearTimeout(timer);
  }
}

/*
 * A Streamable HTTP server may answer a single JSON-RPC request either as
 * application/json or as a one-event text/event-stream. Accept both.
 */
function decodeRpcBody(contentType, text) {
  if (contentType && contentType.includes('text/event-stream')) {
    const payloads = [];
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith('data:')) {
        const chunk = line.slice(5).trim();
        if (chunk && chunk !== '[DONE]') {
          try { payloads.push(JSON.parse(chunk)); } catch { /* ignore keep-alive frames */ }
        }
      }
    }
    return payloads.length === 1 ? payloads[0] : payloads;
  }
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

function openBrowser(url) {
  const command = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    const child = spawn(command, args, {stdio: 'ignore', detached: true});
    // spawn reports a missing launcher asynchronously; an unhandled 'error'
    // event would terminate the capture before the callback ever arrives.
    child.on('error', () => {});
    child.unref();
    return true;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------- discovery */

function resourceMetadataUrlFrom(header) {
  if (!header) return '';
  const match = /resource_metadata="([^"]+)"/i.exec(header);
  return match ? match[1] : '';
}

async function discover(endpoint) {
  const record = {endpoint, probedAt: new Date().toISOString()};

  // An unauthenticated initialize is the documented way to learn the auth
  // requirements: an MCP server must answer 401 with a WWW-Authenticate hint.
  const probe = await fetchJson(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Accept: 'application/json, text/event-stream'},
    body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'initialize', params: {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {name: CLIENT_NAME, version: '1.0.0'}
    }})
  }).catch(error => ({ok: false, status: 0, error: String(error && error.message || error)}));

  const wwwAuthenticate = probe.headers ? probe.headers.get('www-authenticate') : null;
  record.unauthenticatedProbe = {
    status: probe.status,
    error: probe.error || null,
    wwwAuthenticate,
    // Only a 401 is an unambiguous "this MCP server wants a token". A 403 with
    // no challenge is just as likely to be a corporate egress proxy refusing
    // the host, so it must not be reported as a successful reachability probe.
    requiresAuthorization: probe.status === 401 || (probe.status === 403 && Boolean(wwwAuthenticate)),
    reachabilityUncertain: probe.status === 403 && !wwwAuthenticate
  };

  const fromHeader = resourceMetadataUrlFrom(record.unauthenticatedProbe.wwwAuthenticate);
  const base = new URL(endpoint);
  const candidates = [];
  if (fromHeader) candidates.push(fromHeader);
  candidates.push(new URL(`/.well-known/oauth-protected-resource${base.pathname}`, base).toString());
  candidates.push(new URL('/.well-known/oauth-protected-resource', base).toString());

  for (const candidate of candidates) {
    const found = await fetchJson(candidate).catch(() => null);
    if (found && found.ok && found.body && typeof found.body === 'object') {
      record.protectedResourceMetadata = {url: candidate, ...found.body};
      break;
    }
  }

  const issuer = record.protectedResourceMetadata
    && Array.isArray(record.protectedResourceMetadata.authorization_servers)
    && record.protectedResourceMetadata.authorization_servers[0];

  const authBases = [];
  if (issuer) {
    const issuerUrl = new URL(issuer);
    authBases.push(new URL(`/.well-known/oauth-authorization-server${issuerUrl.pathname}`, issuerUrl).toString());
    authBases.push(new URL('/.well-known/oauth-authorization-server', issuerUrl).toString());
    authBases.push(new URL('/.well-known/openid-configuration', issuerUrl).toString());
  }
  authBases.push(new URL('/.well-known/oauth-authorization-server', base).toString());

  for (const candidate of authBases) {
    const found = await fetchJson(candidate).catch(() => null);
    if (found && found.ok && found.body && typeof found.body === 'object' && found.body.authorization_endpoint) {
      record.authorizationServerMetadata = {url: candidate, ...found.body};
      break;
    }
  }

  return record;
}

/* ------------------------------------------------------------------ oauth */

function waitForAuthorizationCode(port, expectedState) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      if (!url.pathname.startsWith('/callback')) { res.writeHead(404).end('Not found'); return; }
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const finish = (message) => {
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(`<!doctype html><meta charset="utf-8"><title>SIG MCP capture</title>
<body style="font:16px system-ui;padding:3rem;max-width:34rem">
<h1 style="font-size:1.2rem">${message}</h1>
<p>You can close this tab and return to the terminal.</p></body>`);
        server.close();
      };
      if (error) { finish(`Authorization failed: ${error}`); reject(new Error(`Authorization error: ${error}`)); return; }
      if (!code) { finish('No authorization code was returned.'); reject(new Error('No authorization code returned.')); return; }
      if (state !== expectedState) { finish('State mismatch — request rejected.'); reject(new Error('OAuth state mismatch.')); return; }
      finish('Authorized. Capture is continuing.');
      resolve(code);
    });
    server.on('error', reject);
    server.listen(port, '127.0.0.1');
    setTimeout(() => { server.close(); reject(new Error('Timed out waiting for the browser callback.')); }, 5 * 60 * 1000);
  });
}

async function authorize(discovery, args) {
  const meta = discovery.authorizationServerMetadata;
  if (!meta) throw new Error('No OAuth authorization-server metadata was discovered. Pass --client-id and check the endpoint.');

  const redirectUri = `http://localhost:${args.port}/callback`;
  let clientId = args.clientId;
  let clientSecret = '';

  if (!clientId && meta.registration_endpoint) {
    console.log('· Registering a client dynamically…');
    const registration = await fetchJson(meta.registration_endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        client_name: CLIENT_NAME,
        redirect_uris: [redirectUri],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
        application_type: 'native'
      })
    });
    if (!registration.ok) throw new Error(`Dynamic client registration failed (${registration.status}): ${registration.text}`);
    clientId = registration.body.client_id;
    clientSecret = registration.body.client_secret || '';
    console.log(`  registered client_id ${clientId}`);
  }

  if (!clientId) throw new Error('No client_id available. The server does not advertise registration; pass --client-id.');

  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  const state = base64url(crypto.randomBytes(16));

  const authorizeUrl = new URL(meta.authorization_endpoint);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('code_challenge', challenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('resource', args.endpoint);
  const scope = args.scope || (Array.isArray(meta.scopes_supported) ? meta.scopes_supported.join(' ') : '');
  if (scope) authorizeUrl.searchParams.set('scope', scope);

  const pending = waitForAuthorizationCode(args.port, state);
  console.log('\n· Sign in with the invited Google account in the browser window.');
  console.log('  If it does not open, paste this URL yourself:\n');
  console.log(`  ${authorizeUrl}\n`);
  openBrowser(authorizeUrl.toString());

  const code = await pending;
  console.log('· Exchanging the authorization code for a token…');

  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
    resource: args.endpoint
  });
  const headers = {'Content-Type': 'application/x-www-form-urlencoded'};
  if (clientSecret) headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;

  const token = await fetchJson(meta.token_endpoint, {method: 'POST', headers, body: form.toString()});
  if (!token.ok) throw new Error(`Token exchange failed (${token.status}): ${token.text}`);
  if (!token.body || !token.body.access_token) throw new Error('Token endpoint returned no access_token.');

  return {
    accessToken: token.body.access_token,
    clientId,
    tokenType: token.body.token_type || 'Bearer',
    scope: token.body.scope || scope || null,
    expiresIn: token.body.expires_in ?? null
  };
}

/* -------------------------------------------------------------------- mcp */

function createSession(endpoint, accessToken) {
  let sessionId = '';
  let nextId = 1;

  async function call(method, params) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': PROTOCOL_VERSION
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    if (sessionId) headers['Mcp-Session-Id'] = sessionId;

    const isNotification = method.startsWith('notifications/');
    const payload = isNotification
      ? {jsonrpc: '2.0', method, params: params || {}}
      : {jsonrpc: '2.0', id: nextId++, method, params: params || {}};

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(endpoint, {method: 'POST', headers, body: JSON.stringify(payload), signal: controller.signal});
    } finally {
      clearTimeout(timer);
    }

    const returned = response.headers.get('mcp-session-id');
    if (returned) sessionId = returned;
    if (isNotification) return null;

    const text = await response.text();
    if (!response.ok) throw new Error(`${method} failed (HTTP ${response.status}): ${text.slice(0, 400)}`);

    const decoded = decodeRpcBody(response.headers.get('content-type'), text);
    const message = Array.isArray(decoded) ? decoded.find(item => item && item.id !== undefined) : decoded;
    if (!message) throw new Error(`${method} returned no JSON-RPC response.`);
    if (message.error) throw new Error(`${method} returned an error: ${JSON.stringify(message.error)}`);
    return message.result;
  }

  return {call, sessionId: () => sessionId};
}

async function listAllTools(session) {
  const tools = [];
  let cursor;
  do {
    const page = await session.call('tools/list', cursor ? {cursor} : {});
    for (const tool of page.tools || []) tools.push(tool);
    cursor = page.nextCursor;
  } while (cursor);
  return tools;
}

/* ------------------------------------------------------------------- diff */

function claimedTools(repoRoot) {
  const file = path.join(repoRoot, 'backend', 'prototype-service.js');
  if (!fs.existsSync(file)) return [];
  const source = fs.readFileSync(file, 'utf8');
  const start = source.indexOf('function mcpTools()');
  if (start < 0) return [];
  const block = source.slice(start);
  const listStart = block.indexOf('tools:[');
  const listEnd = block.indexOf('],applicationApis');
  if (listStart < 0 || listEnd < 0) return [];
  const list = block.slice(listStart, listEnd);
  return [...list.matchAll(/\{name:'([^']+)',group:'([^']+)'/g)].map(match => ({name: match[1], group: match[2]}));
}

function diffInventory(claimed, live) {
  const liveNames = new Set(live.map(tool => tool.name));
  const claimedNames = new Set(claimed.map(tool => tool.name));
  return {
    claimedCount: claimed.length,
    liveCount: live.length,
    confirmed: claimed.filter(tool => liveNames.has(tool.name)).map(tool => tool.name),
    claimedButAbsent: claimed.filter(tool => !liveNames.has(tool.name)).map(tool => tool.name),
    liveButUnclaimed: live.filter(tool => !claimedNames.has(tool.name)).map(tool => tool.name)
  };
}

/* ------------------------------------------------------------------- main */

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(__dirname, '..');
  const outPath = path.resolve(repoRoot, args.out || defaultOutPath());

  console.log(`\nSIG MCP contract capture\n  endpoint ${args.endpoint}\n`);

  console.log('· Discovering authorization requirements…');
  const discovery = await discover(args.endpoint);
  const probe = discovery.unauthenticatedProbe;
  if (probe.error) console.log(`  unauthenticated probe could not connect: ${probe.error}`);
  else console.log(`  unauthenticated initialize → HTTP ${probe.status}${probe.requiresAuthorization ? ' (authorization required, as expected)' : ''}`);
  if (probe.reachabilityUncertain) {
    console.log('  WARNING: HTTP 403 with no WWW-Authenticate challenge.');
    console.log('           This is usually a network or corporate proxy refusing the host,');
    console.log('           not the MCP server asking you to sign in. Check egress before');
    console.log('           reading anything below as a property of the server.');
  }
  if (discovery.protectedResourceMetadata) console.log(`  protected-resource metadata: ${discovery.protectedResourceMetadata.url}`);
  if (discovery.authorizationServerMetadata) console.log(`  authorization server: ${discovery.authorizationServerMetadata.issuer || discovery.authorizationServerMetadata.url}`);
  if (!discovery.protectedResourceMetadata && !discovery.authorizationServerMetadata) {
    console.log('  No OAuth discovery metadata was readable from this network.');
  }

  const evidence = {
    capturedAt: new Date().toISOString(),
    endpoint: args.endpoint,
    capturedBy: CLIENT_NAME,
    clientProtocolVersion: PROTOCOL_VERSION,
    discovery,
    session: null,
    tools: [],
    comparisonWithPrototypeClaim: null,
    limitations: [
      'This records the tool contract the server advertises to an authenticated client.',
      'It does not call any tool, transfer evidence, or prove that a Risk/grp-flood connector exists.',
      'Tool presence is not scientific approval and not proof of a protected evidence path.'
    ]
  };

  if (args.discoverOnly) {
    writeEvidence(outPath, evidence);
    console.log(`\nDiscovery-only capture written to ${path.relative(repoRoot, outPath)}\n`);
    return;
  }

  const token = await authorize(discovery, args);
  console.log(`  token acquired (${token.tokenType}${token.expiresIn ? `, expires in ${token.expiresIn}s` : ''})`);

  const session = createSession(args.endpoint, token.accessToken);
  console.log('· Initializing the MCP session…');
  const initialized = await session.call('initialize', {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: {name: CLIENT_NAME, version: '1.0.0'}
  });
  await session.call('notifications/initialized', {});

  evidence.session = {
    negotiatedProtocolVersion: initialized.protocolVersion || null,
    serverInfo: initialized.serverInfo || null,
    capabilities: initialized.capabilities || null,
    instructions: initialized.instructions || null,
    sessionIdIssued: Boolean(session.sessionId()),
    oauth: {clientId: token.clientId, scope: token.scope, tokenPersisted: false}
  };
  console.log(`  server ${initialized.serverInfo?.name || 'unknown'} ${initialized.serverInfo?.version || ''} · protocol ${initialized.protocolVersion}`);

  console.log('· Listing tools…');
  const tools = await listAllTools(session);
  evidence.tools = tools.map(tool => ({
    name: tool.name,
    title: tool.title || null,
    description: tool.description || null,
    inputSchema: tool.inputSchema || null,
    outputSchema: tool.outputSchema || null,
    annotations: tool.annotations || null
  }));

  const claimed = claimedTools(repoRoot);
  evidence.comparisonWithPrototypeClaim = diffInventory(claimed, evidence.tools);

  writeEvidence(outPath, evidence);
  report(evidence, path.relative(repoRoot, outPath));
}

function writeEvidence(outPath, evidence) {
  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  fs.writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
}

function report(evidence, relativeOut) {
  const diff = evidence.comparisonWithPrototypeClaim;
  console.log(`\n  ${evidence.tools.length} tool(s) enumerated:\n`);
  for (const tool of evidence.tools) {
    const required = tool.inputSchema && Array.isArray(tool.inputSchema.required) ? tool.inputSchema.required : [];
    const properties = tool.inputSchema && tool.inputSchema.properties ? Object.keys(tool.inputSchema.properties) : [];
    console.log(`    ${tool.name.padEnd(24)} ${properties.length} arg(s)${required.length ? ` · required: ${required.join(', ')}` : ''}`);
  }

  console.log('\n  Against this prototype\'s claimed inventory:');
  console.log(`    claimed ${diff.claimedCount} · live ${diff.liveCount} · confirmed ${diff.confirmed.length}`);
  if (diff.claimedButAbsent.length) console.log(`    CLAIMED BUT NOT ON SERVER: ${diff.claimedButAbsent.join(', ')}`);
  if (diff.liveButUnclaimed.length) console.log(`    ON SERVER BUT NOT CLAIMED: ${diff.liveButUnclaimed.join(', ')}`);
  if (!diff.claimedButAbsent.length && !diff.liveButUnclaimed.length) console.log('    Inventory matches exactly.');

  console.log(`\n  Evidence written to ${relativeOut}`);
  console.log('  No access token was written to disk.\n');
}

main().catch(error => {
  console.error(`\nCapture failed: ${error.message}\n`);
  process.exit(1);
});
