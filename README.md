# KarAan (کارآن) - Local Infrastructure & Platform Guide

KarAan is a Production-Ready Iranian Hourly & Shift Workforce Platform built on Next.js App Router, TypeScript (Strict), PostgreSQL + PostGIS, Redis, Drizzle ORM, and MinIO S3 storage.

---

## 🛠 Local Infrastructure Stack (Docker Compose)

The local development environment uses `docker-compose.yml` to spin up isolated containers with built-in healthchecks:

1. **PostgreSQL 15 + PostGIS 3.3**: Database with spatial GIS extensions.
   - Port: `5432`
   - Healthcheck: `pg_isready -U postgres -d karaan`
2. **Redis 7 (Alpine)**: Live geospatial worker location cache & BullMQ queue.
   - Port: `6379`
   - Healthcheck: `redis-cli ping`
3. **MinIO Object Storage**: S3-compatible file storage for worker document uploads.
   - API Port: `9000` | Console Port: `9001`
   - Healthcheck: `curl -f http://localhost:9000/minio/health/live`
4. **App (Next.js Application)**: Fully containerized production app with auto-wait on PostgreSQL and Redis health states.

---

## 🔑 Environment Variables Setup (`.env.example`)

Copy `.env.example` to `.env.local` or `.env` before running the application:

```bash
cp .env.example .env.local
```

### Complete Variable Reference:

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `development` |
| `NEXT_PUBLIC_APP_URL` | Application Public URL | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL PostGIS Connection String | `postgres://postgres:postgrespassword@localhost:5432/karaan` |
| `REDIS_URL` | Redis Connection String | `redis://localhost:6379` |
| `AUTH_SECRET` | Secret key for JWT & Session signing | `karaan_super_secret_jwt_key_2026` |
| `SMS_PROVIDER` | SMS Provider Driver (`mock` \| `kavenegar` \| `farazsms`) | `mock` |
| `SMS_API_KEY` | SMS Provider API Key | `your_sms_api_key` |
| `PAYMENT_PROVIDER` | Payment Gateway Driver (`mock` \| `zarinpal`) | `mock` |
| `PAYMENT_API_KEY` | Payment Gateway Merchant ID | `your_zarinpal_merchant_id` |
| `PAYMENT_CALLBACK_URL` | Payment Callback URL | `http://localhost:3000/api/finance/callback` |
| `MAP_PROVIDER` | Map Provider Driver (`mock` \| `neshan` \| `balad`) | `mock` |
| `MAP_API_KEY` | Map Provider API Key | `your_neshan_api_key` |
| `S3_ENDPOINT` | MinIO / S3 Storage Endpoint | `http://localhost:9000` |
| `S3_BUCKET` | S3 Upload Bucket | `karaan-uploads` |
| `S3_ACCESS_KEY` | S3 Access Key ID | `minioadmin` |
| `S3_SECRET_KEY` | S3 Secret Key | `minioadminpassword` |
| `SENTRY_DSN` | Sentry Error Monitoring DSN (Optional) | `""` |

---

## 💻 Local Development Workflow

### 1. Launch Services via Docker Compose
```bash
docker-compose up -d
```

### 2. Database Migration & Seed
```bash
# Push schema migrations to PostgreSQL
npm run db:migrate

# Seed database with mock users & initial shifts
npm run db:seed

# (Optional) Open Drizzle Visual Studio
npm run db:studio
```

### 3. Start Next.js Development Server
```bash
npm run dev
```

Visit the app at [http://localhost:3000](http://localhost:3000).

---

## 📜 All Package Scripts Reference

```bash
npm run dev          # Start Next.js App Router in development mode
npm run build        # Build production bundle using Webpack compiler
npm run start        # Start Next.js production server
npm run lint         # Execute ESLint checks
npm run typecheck    # Execute strict TypeScript typecheck (tsc --noEmit)
npm run test         # Execute Vitest unit & integration test suite
npm run test:e2e     # Execute Playwright End-to-End test suite
npm run db:generate  # Generate Drizzle migration files
npm run db:migrate   # Apply database migrations
npm run db:studio    # Launch Drizzle Studio database GUI
npm run db:seed      # Seed PostgreSQL with initial mock data
```

---

## 🏥 Service Health Checks

The application provides an API health check route handler at `/api/health`:

- Endpoint: `GET /api/health`
- Response:
```json
{
  "status": "ok",
  "timestamp": "2026-08-13T19:00:00.000Z",
  "services": {
    "api": "healthy",
    "redis": "healthy"
  }
}
```
