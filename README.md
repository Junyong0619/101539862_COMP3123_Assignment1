# COMP3123 Assignment 1 – Employee Management REST API

**Student:** Junyong Choi (101539862)
**Course:** COMP3123 Full Stack Development I, Fall 2026

## 1. Project

A secure back-end REST API for managing employee records. Users register and log in, receive a JSON Web Token (JWT), and then create, read, update and delete **their own** employees. Every employee belongs to the user who created it, and that ownership is enforced inside every database query so one user can never see or touch another user's data.

### Technologies

| Area | Library |
|---|---|
| Runtime / framework | Node.js 24, Express 5 |
| Database | MongoDB 8 (Docker locally), Mongoose 9 |
| Authentication | jsonwebtoken (JWT), bcrypt (password hashing) |
| Security | helmet (HTTP headers), express-rate-limit (auth brute-force protection) |
| Validation | express-validator |
| Logging | winston (file + console), morgan (HTTP request log) |
| Config | dotenv (`.env`) |

### Project structure

```
src/
  server.js                 # loads .env, connects to MongoDB, starts the HTTP server
  app.js                    # Express app: helmet, rate limit, JSON parser, request log, routers, 404, error handler
  config/db.js              # Mongoose connection
  models/User.js            # username/email/password (hashed, never selected by default)
  models/Employee.js        # employee fields + `user` owner reference
  routes/userRoutes.js      # /api/v1/user  (signup, login)
  routes/employeeRoutes.js  # /api/v1/emp   (protected employee CRUD)
  controllers/userController.js
  controllers/employeeController.js
  middleware/auth.js        # JWT verification -> req.user
  middleware/validate.js    # express-validator rule sets + result check
  middleware/errorHandler.js# 404 handler + centralized error handler
  utils/AppError.js         # Error with HTTP status code
  utils/jwt.js              # sign / verify helpers
  utils/logger.js           # winston logger (logs/app.log, logs/error.log)
postman/                    # exported Postman collection
logs/samples/               # sample log output (real logs are git-ignored)
.env.example                # required environment variables (no secrets)
```

Request flow: `helmet → rate limit (auth routes) → express.json → morgan → router → [auth middleware] → validation → controller → (error) → errorHandler`.

## 2. Installation

```bash
# 1. clone
git clone https://github.com/Junyong0619/101539862_COMP3123_Assignment1.git
cd 101539862_COMP3123_Assignment1

# 2. install dependencies
npm install

# 3. configure environment
cp .env.example .env        # then edit the values (see Configuration)

# 4. start MongoDB (Docker example)
docker run -d --name comp3123-mongodb -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=rootadmin -e MONGO_INITDB_ROOT_PASSWORD=<choose-a-password> mongo:8

# 5. start the API
npm start                   # or: npm run dev (nodemon)
# -> "MongoDB connected: comp3123_assignment1" / "Server started on port 3000"

# 6. test
curl http://localhost:3000/health
```

Then import `postman/COMP3123_Assignment1.postman_collection.json` into Postman and run the folders from top to bottom (see Testing).

## 3. Configuration

All configuration comes from environment variables. Copy `.env.example` to `.env`; the real `.env` is git-ignored and must never be committed.

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | HTTP port | `3000` |
| `MONGODB_URI` | Mongoose connection string | `mongodb://<user>:<password>@localhost:27017/comp3123_assignment1?authSource=admin` |
| `JWT_SECRET` | Secret used to sign and verify tokens (long random string) | `<long-random-secret>` |
| `JWT_EXPIRES_IN` | Token lifetime | `1h` |

## 4. API

Base URL: `http://localhost:3000`

### User endpoints (`/api/v1/user`)

| # | Method | Endpoint | Success | Purpose |
|---|---|---|---|---|
| 1 | POST | `/api/v1/user/signup` | 201 | Register a user (`username`, `email`, `password`) |
| 2 | POST | `/api/v1/user/login` | 200 | Log in with `username` **or** `email` + `password`; returns `jwt_token` |

### Employee endpoints (`/api/v1/emp`) – require `Authorization: Bearer <token>`

| # | Method | Endpoint | Success | Purpose |
|---|---|---|---|---|
| 3 | GET | `/api/v1/emp/employees` | 200 | List employees owned by the authenticated user |
| 4 | POST | `/api/v1/emp/employees` | 201 | Create an employee for the authenticated user |
| 5 | GET | `/api/v1/emp/employees/{eid}` | 200 | Get one of the user's employees |
| 6 | PUT | `/api/v1/emp/employees/{eid}` | 200 | Update one of the user's employees (partial update allowed) |
| 7 | DELETE | `/api/v1/emp/employees?eid=xxx` | 204 | Delete one of the user's employees |

### Other

| Method | Endpoint | Success | Purpose |
|---|---|---|---|
| GET | `/health` | 200 | Health check |

### Request / response examples

```http
POST /api/v1/user/signup
{ "username": "alice", "email": "alice@example.com", "password": "Password123!" }
-> 201 { "message": "User created successfully", "user_id": "..." }

POST /api/v1/user/login
{ "username": "alice", "password": "Password123!" }
-> 200 { "message": "Login successful", "jwt_token": "<jwt>", "user_id": "..." }

POST /api/v1/emp/employees            Authorization: Bearer <jwt>
{ "first_name": "John", "last_name": "Doe", "email": "john.doe@example.com",
  "position": "Software Developer", "salary": 80000,
  "date_of_joining": "2024-01-15", "department": "IT" }
-> 201 { "message": "Employee created successfully", "employee_id": "..." }
```

Error responses always have the same shape:

```json
{ "status": "error", "message": "Validation failed",
  "details": [ { "field": "email", "message": "Valid email is required" } ] }
```

### HTTP status codes used

| Code | When |
|---|---|
| 200 | Successful read / update / login |
| 201 | User or employee created |
| 204 | Employee deleted (no body) |
| 400 | Validation failure, malformed JSON, invalid ObjectId, missing `eid` |
| 401 | Invalid credentials; missing, invalid or expired JWT |
| 404 | Employee not found **or belongs to another user**; unknown route |
| 409 | Duplicate username/email, duplicate employee email for the same user |
| 429 | Too many authentication requests (rate limit) |
| 500 | Unexpected server error (details are logged, not returned) |

## 5. Authentication

1. **Signup** – the password is hashed with bcrypt (10 salt rounds) in a Mongoose `pre('save')` hook; the plain password is never stored.
2. **Login** – the user is looked up by username or email, the password is compared with `bcrypt.compare`. A wrong username and a wrong password return the **same** `401 Invalid username or password` so the API does not reveal which accounts exist.
3. **JWT** – on success the server signs `{ sub: <user id>, username }` with `JWT_SECRET` (expires in `JWT_EXPIRES_IN`). The token contains no password or email.
4. **Authorization header** – clients send `Authorization: Bearer <token>` on every employee request.
5. **Protected employee endpoints** – `middleware/auth.js` runs before every `/api/v1/emp` route: it rejects a missing header (401), an invalid signature (401), an expired token (401 "Token has expired") and a token whose user no longer exists (401). On success it loads the user and attaches it as `req.user`.

## 6. Authorization (data ownership)

- Each employee document stores `user: ObjectId` (reference to the owner) and the model requires it.
- The owner is **always** taken from `req.user._id` (the verified token), never from the request body, URL or query string. A whitelist (`pickFields`) drops any `user` field a client sends.
- **Every** employee query is scoped to the owner: `find({ user })`, `findOne({ _id, user })`, `findOneAndUpdate({ _id, user })`, `findOneAndDelete({ _id, user })`. Another user's employee therefore simply does not match and the API returns `404 Employee not found`. Returning 404 instead of 403 avoids confirming that the ID exists.
- The Postman folder *03 Ownership – two users* proves this with two accounts (alice and bob) for read, update and delete in both directions.

## 7. Security

| Measure | Implementation |
|---|---|
| Password hashing | bcrypt, cost 10; `password` field has `select: false` and is stripped in `toJSON` |
| JWT | Signed with server secret, 1 h expiry, verified on every protected request |
| Helmet | `app.use(helmet())` sets security headers (CSP, X-Content-Type-Options, X-Frame-Options, HSTS, etc.) |
| Rate limiting | `express-rate-limit` on `/api/v1/user/*`: 20 requests per 15 minutes per IP → `429 Too many requests` |
| Input validation | `express-validator` rules for signup, login, employee create/update, `eid` param/query; Mongoose schema constraints as a second layer |
| Environment variables | Secrets and connection strings only in `.env` (git-ignored); `.env.example` documents the keys |
| Error handling | Centralized handler converts Mongoose/body-parser errors to 400/409 and hides internal messages behind `500 Internal server error` |

## 8. Logging

- **Where:** `logs/app.log` (all levels) and `logs/error.log` (errors only), plus the console. Created automatically by winston. Real logs are git-ignored; `logs/samples/app.log` is an example.
- **What is logged:** every HTTP request (`method url status response-time`), server start / DB connection, user registration and login success, failed login attempts, validation failures (field names only), authorization failures (401/404 with route), employee create/update/delete with employee and user IDs, and stack traces for 500 errors.
- **Intentionally excluded:** passwords, password hashes, JWT tokens, the JWT secret, the MongoDB connection string and request bodies.

## 9. Health check

`GET /health` → `200`

```json
{ "status": "ok", "uptime": 12.34, "timestamp": "2026-10-17T00:00:00.000Z" }
```

## 10. Testing

Import `postman/COMP3123_Assignment1.postman_collection.json`. The collection variable `baseUrl` defaults to `http://localhost:3000`. Run the folders in order:

| Folder | Covers |
|---|---|
| 00 Health | health check |
| 01 Users | signup (success, duplicate 409, validation 400), login (username, email, invalid 401); stores `tokenA`/`tokenB` |
| 02 Employees – User A | create, list, get by id, update |
| 03 Ownership – two users | cross-user read/update/delete rejected (404), `user` field injection ignored, deletes (204) |
| 04 Errors and security | malformed JSON, missing/invalid JWT, invalid id, non-existing employee, validation, empty update body, missing eid, unknown route |
| 05 Rate limiting | run the login request 25× with the Collection Runner → 401 then 429 after 20 |

Each request has test scripts that assert the expected status code, so the Runner shows pass/fail for the whole suite.

### Sample credentials for marking (test data only)

| User | username | email | password |
|---|---|---|---|
| A | `alice` | `alice@example.com` | `Password123!` |
| B | `bob` | `bob@example.com` | `Password123!` |
