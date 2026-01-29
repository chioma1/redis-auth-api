## My Approach

I tried to keep this API small, easy to follow, and secure enough for the scope of this exercise. Redis handles the simple credential storage, bcrypt hashes passwords, and the API returns clear 400/401 errors for bad input or failed authentication.

For the scope of this exercise I kept the auth flow sessionless (login only returns a success message instead of issuing a token or cookie). If this were going into production, my next steps would be to add token-based auth, basic account lockout, and stronger request validation on the HTTP layer. I applied Rate limiting to the authentication routes to reduce brute-force attempts while making login stricter.


## Tech stack

- Node.js + Express
- Redis (data storage)
- bcrypt (password hashing)
- helmet (security headers)
- express-rate-limit (basic request throttling)

## Setup

### Requirements
- Node.js installed
- Redis running locally or accessible via URL

### Environment variables
- `REDIS_URL` (optional): The Redis connection string can be local (default `redis://localhost:6379`) or an external/managed Redis services like AWS (ElastiCache/MemoryDB).
- `PORT` (optional, defaults to `3000`)

### Install & run
```bash
npm install
node src/server.js
```

## API

Base path: `/api/auth`  
All requests/responses are JSON.

### Register

`POST /api/auth/register`

Request body:
```json
{
  "username": "mary",
  "password": "StrongPass1"
}
```

Success:
- `201 Created`
```json
{ "message": "User created successfully" }
```

Errors:
- `400 Bad Request` (used for invalid input, weak password or if username already exists)
```json
{ "error": "Username already exists" }
```

### Login

`POST /api/auth/login`

Request body:
```json
{
  "username": "mary",
  "password": "StrongPass1"
}
```

Success:
- `200 OK`
```json
{ "message": "Login successful" }
```

Errors:
- `400 Bad Request` (invalid input)
- `401 Unauthorized` (invalid username or password)
```json
{ "error": "Invalid username or password" }
```

## Validation rules

### Username
- Must be a string
- Whitespace is trimmed
- Length must be 3–20 characters

### Password
- Must be a string
- Must be at least 8 characters and include:
  - at least one uppercase letter
  - at least one lowercase letter
  - at least one number

## Quick test (curl)

```bash
# Register
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"mary","password":"StrongPass1"}'

# Login
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mary","password":"StrongPass1"}'
```

## Redis key choice (future improvement)

For this small project I’m using the username directly as the Redis key (`user:${username}`) because it keeps the code simple and the lookups fast. At larger scale, usernames tend to change over time, so relying on them as primary keys can make data migrations and refactors harder than they need to be.

If I were to evolve this further, I’d switch to an ID-based design where each user is stored under a stable key like `user:${userId}`, and keep a separate lookup key to map usernames to IDs (for example, `user:by-username:${username} -> ${userId}`). That makes username changes easier and scales better for long-term user management. For example, when someone logs in with `"mary"`, the flow would be: read `user:by-username:mary` to get the userId, then read `user:${userId}` to load the user record and verify the password.

The user hash currently includes `createdAt` and `lastLoginAt`. Future fields for security and auditing could include `failedLoginCount` and `lockedUntil` to support lockouts and brute-force protection.

## CORS (future improvement)
- Configure CORS with an allowlist once the expected calling domains are known (e.g., restrict `Origin` to approved internal service domains rather than allowing all cross-origin requests).


## Other future improvements

If I had more time, I’d look at:

- Adding a health check endpoint (e.g., `GET /health`) that verifies the API is running and that Redis is reachable.
- Expanding the test suite beyond the auth service to cover the HTTP layer and edge cases end-to-end.
- Using a request schema validation library (e.g., Joi) to validate request bodies consistently and reduce manual validation code.
- Adding token-based authentication (JWT or server-generated session tokens) so services can authenticate subsequent requests without re-sending credentials.
- Adding authorization support (roles/permissions): store a user role, include it in the auth token, and apply role-based authorization middleware on protected routes.
- Creating an authentication middleware to protect routes that require authentication (validate the token and attach user context to the request).