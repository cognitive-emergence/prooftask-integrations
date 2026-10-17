# Public remote MCP gateway — implementation candidate

This source implements anonymous Streamable HTTP discovery using the official MCP SDK. It has passed an official SDK client handshake, tool listing and invocation test against a local HTTP server. **It is not deployed, and no public remote URL is advertised.**

## Run and verify

```sh
cd remote
npm ci --ignore-scripts
node --test server.test.mjs
node server.mjs
```

The local endpoint is `http://127.0.0.1:3000/mcp`. Exactly three tools are available: capabilities, public template search, and pinned public template reads. No Agent token or incoming Authorization header is used. Private tools and writes are absent, regardless of environment credentials or local write opt-in settings.

Host and Origin are allowlisted, request bodies are bounded at 32 KB, upstream calls have a 30-second timeout, and concurrent POSTs are bounded at eight. No resumable sessions or server event streams are offered. Public HTTP reads do not grant private workflow authority.

## Production work still required

Integrate the gateway into the existing deployment and routing boundary, with TLS, correct Host allowlisting, provider rate limits and the existing production verification process. Set `PUBLIC_MCP_ALLOWED_HOSTS` to the exact deployed hostname. Browser-based clients require explicit `PUBLIC_MCP_ALLOWED_ORIGINS` and a reviewed CORS policy; arbitrary browser origins are not supported. Do not advertise a localhost or unverified remote as production.

The site's downloadable catalog currently differs from the integration package: synchronize public discovery through the application's source catalog in a scoped PR and verify the exact deployed release.

Private remote tool access is a later milestone. Existing device-style Agent authorization is not an OAuth authorization server. Implement and validate standard remote authorization separately, preserving workspace isolation, exact grants, expiry/revocation and human decision boundaries. Never forward a general browser session or shared server token to make private remote calls work.

## Commercial integration acceptance

1. Find an appropriate public template without an account; retain its exact version and digest.
2. User connects the intended workspace and explicitly approves the required scope.
3. Prepare a reviewable draft; keep signing, acceptance, record issuance and checkout as separate actions.
4. Persist an external task mapping and original request ID. Lost responses must reconcile the same job rather than create a duplicate.
5. Handle human continuation, renewal, revoked access and final status readback in the originating product.

Current evidence covers anonymous discovery and protocol boundaries only. It does not establish a real customer's end-to-end use, marketplace approval or AI recommendation rate.
