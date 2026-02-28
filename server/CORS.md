# CORS (Cross-Origin Resource Sharing)

## What is an Origin?

An origin is the combination of **protocol + domain + port**:

```
http://localhost:5173
^^^    ^^^^^^^^^  ^^^^
proto   domain    port
```

Two URLs have the **same origin** only if all three match exactly.

## The Problem CORS Solves

Browsers enforce the **Same-Origin Policy** — JavaScript on one origin **cannot** make requests to a different origin by default. This prevents malicious sites from making requests to your bank's API using your cookies.

```
http://localhost:5173  -->  http://localhost:4000  = BLOCKED (different port = different origin)
```

CORS is the mechanism that lets servers **opt in** to receiving cross-origin requests.

## How It Works

### Simple Requests (GET, POST with simple headers)

1. Browser sends the request with an `Origin` header
2. Server responds with `Access-Control-Allow-Origin`
3. Browser checks if the origin is allowed — if not, it **blocks the response** (request still reached the server)

### Preflight Requests (PUT, DELETE, custom headers, JSON content-type)

For "non-simple" requests, the browser sends a **preflight** `OPTIONS` request first:

```
OPTIONS /graphql HTTP/1.1
Origin: http://localhost:5173
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization
```

Server must respond with:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: content-type, authorization
```

Only if this passes does the browser send the **actual** request.

## Key Response Headers

| Header | Purpose |
|--------|---------|
| `Access-Control-Allow-Origin` | Which origin(s) can access (`*` for any, or a specific origin) |
| `Access-Control-Allow-Methods` | Allowed HTTP methods |
| `Access-Control-Allow-Headers` | Allowed request headers |
| `Access-Control-Allow-Credentials` | Whether cookies/auth headers are allowed (`true`/`false`) |
| `Access-Control-Max-Age` | How long (seconds) the browser caches the preflight result |

## Common Gotchas

- **Trailing slash matters**: `http://localhost:5173/` !== `http://localhost:5173`
- **Wildcard + credentials don't mix**: You can't use `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true` — you must specify the exact origin
- **CORS is browser-only**: Server-to-server requests (curl, Postman, backend services) are never blocked by CORS
- **The request still hits the server**: CORS doesn't prevent the server from receiving the request — it prevents the **browser** from reading the response

## Express Example

```js
import cors from 'cors';

// Allow specific origins
app.use(cors({
  origin: ['http://localhost:5173', 'https://myapp.com'],
  methods: ['GET', 'POST'],
  credentials: true, // allow cookies
}));

// Allow all origins (development only)
app.use(cors());
```
