# AI Gateway Client

A local, no-login test client for an OAuth-protected [MCP](https://modelcontextprotocol.io) gateway — the kind that authenticates callers itself (OAuth Authorization Code + PKCE, with Dynamic Client Registration for callers it's never seen before) rather than trusting a static API key. Defaults to [PingOne's Privilege AI Gateway](https://www.pingidentity.com), which works out of the box against the public Ping AI Demo instance with zero setup.

It shows the same tool call through two paths — **straight at the gateway** (Privilege mode, policy enforced) and **no gateway in the path at all** (Direct mode) — so you can see exactly what the gateway adds: the same call succeeding, being refused, or being logged, depending only on which door you went through. Both doors default to the public Ping AI Demo instance and work with zero setup; point either at your own MCP server/gateway when you're ready.

## Installation

**Prerequisites:** Node.js 22+ and npm. Docker is optional (a `Dockerfile` is included).

```bash
git clone https://github.com/curtismu7/ai-gateway-client.git
cd ai-gateway-client
npm run install:all   # installs both server/ and web/
npm start              # builds the UI, then starts the server on :3910
```

Verify it's up:

```bash
curl http://127.0.0.1:3910/health
```

Then open http://127.0.0.1:3910. It defaults to the **Privilege** door on the public Ping AI Demo gateway — click **Sign in** and complete the OAuth flow in your browser (no client registration needed; the tool registers itself with the gateway on the fly via RFC 7591 Dynamic Client Registration). Switch to the **Direct** door to make the same call with no gateway in front — it defaults to the same demo's façade, which is a separate self-advertising, open-registration broker, so it also needs no setup.

## What it does

- **OAuth PKCE + DCR** — discovers the gateway's own authorization server (RFC 9728 protected-resource metadata, or a `WWW-Authenticate` challenge), registers itself as a client if the gateway doesn't already trust one (RFC 7591), and runs the PKCE Authorization Code flow. Falls back to plain PingOne OIDC discovery if you point it at an environment id instead.
- **Tools** — `tools/list` / `tools/call`, with a policy summary (how many tools were filtered by the gateway vs. permitted).
- **Raw MCP requests** — anything that isn't `tools/call`: resources, prompts, completion, tasks.
- **Doors probe** — "denied here — does this identity work anywhere else?" Tries the same token against every other configured door in one click, since a policy denial often comes back as a bare 403 with no detail.
- **Relay log** — every request/response this tool sends and receives, live over SSE, so you can see exactly what went over the wire.
- **LLM Gateway comparison** — choose a known attack or enter a prompt manually, then compare the protected Privilege Anthropic lane with direct llama.cpp and LM Studio local lanes. The protected lane can block before the provider sees the prompt; local lanes have no policy layer.
- **Privilege console door discovery** (optional) — paste your Privilege console session's `auth_token` cookie to pull in every Agentic App and policy registered on your environment as selectable doors, no code change or redeploy needed.

## Config

Copy `server/.env.example` to `server/.env`. Nothing is required to try either door against the public demo — set `PRIVILEGE_GATEWAY_HOST` (and friends) to point Privilege mode at your own Privilege AI Gateway, or `DIRECT_MCP_URL` to point Direct mode at any other MCP server you run.

The optional LLM Gateway tab requires `PRIVILEGE_LLM_GATEWAY_URL` and `PRIVILEGE_LLM_VIRTUAL_KEY_ANTHROPIC` for the protected lane. Set `LLAMACPP_BASE_URL` and/or `LMSTUDIO_BASE_URL` for direct local comparisons. These values are read by the server only; the browser receives configuration status, never keys.

## Development

```bash
npm run install:all
npm run dev   # server on :3910 (API), Vite dev server on :5174 (UI)
```

The OAuth callback URL is derived from whichever host the browser used to reach the API, so DCR-based sign-in (the default, self-registering path) works the same in dev or prod. If you configure a **static** client id instead (no DCR), register both `http://127.0.0.1:3910/api/gateway/auth/callback` and `http://127.0.0.1:5174/api/gateway/auth/callback` as redirect URIs, or just test against the production build (`npm start`).

## Docker

```bash
docker build -t ai-gateway-client .
docker run -p 3910:3910 -v ai-gateway-client-data:/root/.ai-gateway-client ai-gateway-client
```

## Scope note

The standalone client still focuses on MCP tool calling. Its optional LLM comparison is intentionally server-side and limited to the protected Anthropic lane plus direct local Llama.cpp/LM Studio lanes; it does not reuse the larger demo's BFF session or findings service.
