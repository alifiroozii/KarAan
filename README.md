# KarAan (کارآن) - Iranian Hourly & Shift Workforce Platform

Production-Ready Full-Stack Modular Monolith platform built with **Next.js App Router**, **TypeScript**, **PostgreSQL + PostGIS**, **Redis**, and **Drizzle ORM** for matching, attendance tracking, and idempotent financial settlements for hourly and shift workers in Iran.

---

## 🏗 System Architecture & Directory Structure

KarAan follows a **Modular Monolith** structure isolating domain features, adapters, and data layers:

```
src/
├── app/                  # Next.js App Router (Public, Auth, Worker PWA, Employer, Admin, API)
│   ├── (public)/         # Public landing & static pages
│   ├── (auth)/           # Authentication pages (SMS OTP)
│   ├── worker/           # Worker Mobile PWA dashboard & Shift Execution HUD
│   ├── employer/         # Employer Desktop & Mobile responsive dashboard
│   ├── admin/            # Admin management portal & Audit Trail viewer
│   └── api/              # Standardized REST / RPC API routes
├── components/           # UI Component Library (shadcn/ui primitives & layouts)
│   ├── ui/               # Base UI primitives (Button, Card, Input, Badge)
│   ├── common/           # Common components (Header, Footer, Spinner)
│   ├── layout/           # PageShell, Sidebar
│   ├── maps/             # Interactive map picker component
│   ├── worker/           # Worker profile cards
│   ├── employer/         # Employer cards
│   └── shifts/           # Shift cards
├── features/             # Business Domain Features
│   ├── auth/             # OTP authentication & JWT sessions
│   ├── users/            # User profile management
│   ├── workers/          # Worker skill set & reliability profile
│   ├── employers/        # Employer company profiles
│   ├── businesses/       # Business entity records
│   ├── branches/         # Branch locations
│   ├── shifts/           # Shift creation & status machine
│   ├── matching/         # PostGIS radial spatial search & Redis live index
│   ├── location/         # GPS tracking & geofencing validation
│   ├── attendance/       # Clock-in / clock-out & timesheet calculator
│   ├── payments/         # Zarinpal / Mock payment gateway adapter
│   ├── wallet/           # Wallet balance & escrow ledger
│   ├── ratings/          # Mutual rating & reliability scoring
│   ├── notifications/    # Kavenegar / FarazSMS notification service
│   └── disputes/         # Shift dispute management
├── db/                   # Database layer
│   ├── schema/           # Drizzle schema definitions (PostgreSQL + PostGIS)
│   ├── migrations/       # SQL migration scripts
│   └── queries/          # Reusable database queries
├── lib/                  # Infrastructure Adapters & System Drivers
│   ├── auth/             # Authorization middleware & helpers
│   ├── redis/            # Redis client & BullMQ setup
│   ├── queue/            # Async job queues
│   ├── maps/             # Neshan / OpenStreetMap adapter
│   ├── payments/         # Gateway driver interfaces
│   ├── sms/              # SMS gateway driver interfaces
│   ├── storage/          # MinIO / S3 file upload adapter
│   └── realtime/         # Socket.IO realtime connection handlers
├── hooks/                # Custom React hooks (useAuth, useLocation, useDebounce)
├── stores/               # Zustand state stores (authStore, shiftStore)
├── validators/           # Zod schema validators (authSchema, shiftSchema)
├── types/                # TypeScript type definitions
└── config/               # System configuration & Zod environment validation (env.ts)
```

---

## ⚡ Tech Stack

- **Framework**: Next.js 15+ (App Router, React 19)
- **Language**: TypeScript Strict
- **Styling**: Tailwind CSS v4, Vazirmatn Persian Font, RTL layout (`dir="rtl"`)
- **UI & Motion**: Lucide Icons, Framer Motion
- **State & Data**: TanStack Query, Zustand, React Hook Form, Zod
- **Database & Spatial**: PostgreSQL + PostGIS, Drizzle ORM
- **Cache & Realtime**: Redis, BullMQ, Socket.IO
- **Storage & Services**: MinIO / S3 Adapter, Payment Gateway Adapter (Zarinpal / Mock), SMS Adapter (Kavenegar / Mock), Map Adapter (Neshan / Mock)
- **Testing**: Vitest, Docker

---

## ⚙️ Environment Variables & Configuration

All environment variables are strictly validated at launch via `src/config/env.ts`:

```env
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgrespassword@localhost:5432/karaan
REDIS_URL=redis://localhost:6379
JWT_SECRET=karaan_super_secret_jwt_key_2026

# Adapters
SMS_PROVIDER=mock # mock | kavenegar | farazsms
KAVENEGAR_API_KEY=

MAP_PROVIDER=mock # mock | neshan | balad
NESHAN_API_KEY=

PAYMENT_PROVIDER=mock # mock | zarinpal
ZARINPAL_MERCHANT_ID=

S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadminpassword
S3_BUCKET=karaan-uploads

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🛠 Commands & Development Scripts

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (PostGIS), Redis, and MinIO via Docker Compose
docker-compose up -d

# 3. Push Database Schema
npx drizzle-kit push

# 4. Start Next.js Development Server
npm run dev

# 5. Typecheck & Verification
npm run typecheck
npm run lint
npm run test
```

---

## 🔒 Security & Architecture Directives

1. **Server-Side Authorization**: Every API route and Server Action verifies identity via `requireAuth` and role access via `requireRole(["WORKER", "EMPLOYER", "ADMIN"])`.
2. **Idempotent Financial Transactions**: Double-entry ledger architecture enforcing unique `idempotency_key` headers for all wallet & escrow movements. Money is ALWAYS stored as integer Rials (BigInt).
3. **UTC Data Isolation**: All timestamps stored in UTC in PostgreSQL and formatted to Jalali (Shamsi) in the user interface.
