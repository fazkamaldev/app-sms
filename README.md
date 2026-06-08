# Login Monorepo

Multi-container auth stack with nginx load balancer, two React frontends, two FastAPI BFFs, MySQL, and Redis.

## Architecture

| Service   | Stack                          | URL prefix        |
|-----------|--------------------------------|-------------------|
| nginx     | Load balancer / reverse proxy  | `http://localhost:8080` |
| fe-login  | React + Vite + TS + Bootstrap  | `/login`          |
| fe-app    | React + Vite + TS + Redux + Bootstrap | `/app`     |
| bff-auth  | FastAPI + MySQL + authlib + Redis | `/api/auth/*` |
| bff-app   | FastAPI + MySQL                | `/api/app/*`      |
| bff-sms   | FastAPI + Mobile Message API   | `/api/app/send-message` |
| MySQL     | 8                              | `:3306`           |
| Redis     | 7                              | `:6379`           |

## Quick start

Copy the environment template and set your SMS API credentials:

```bash
cp .env.example .env
```

```bash
docker compose up --build
```

Open [http://localhost:8080/login](http://localhost:8080/login)

**Credentials:** `admin` / `admin`

## Auth flow

1. User submits login form → `POST /api/auth/login`
2. `bff-auth` validates credentials against MySQL, creates Redis session
3. HttpOnly `session_id` cookie is set (SameSite=Lax)
4. Browser redirects to `/app/`
5. `fe-app` calls `GET /api/auth/me` on bootstrap; redirects to `/login` if unauthenticated
6. Failed login redirects to `/login?attempt=1`

## Local frontend dev

Run infrastructure first:

```bash
docker compose up mysql redis bff-auth bff-app nginx
```

Then in separate terminals:

```bash
cd fe-login && npm install && npm run dev
cd fe-app && npm install && npm run dev
```

Vite dev servers proxy `/api` to `http://localhost:8080`. The fe-login dev server also proxies `/app` to fe-app (`:5174`), so post-login redirects work when using `http://localhost:5173/login/`.

## Smoke tests

```bash
# Login
curl -c cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Me (with cookie)
curl -b cookies.txt http://localhost:8080/api/auth/me

# Me (without cookie — expect 401)
curl http://localhost:8080/api/auth/me

# App settings (with cookie)
curl -b cookies.txt http://localhost:8080/api/app/settings
```

## Project layout

```
login/
├── docker-compose.yml
├── nginx/
├── mysql/
├── bff-auth/
├── bff-app/
├── bff-sms/
├── fe-login/
└── fe-app/
```
