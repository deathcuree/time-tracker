# SHE-TIME-TRACKER

## Tech Stack

- Frontend
  - React 18 + TypeScript
  - Vite
  - Tailwind CSS + shadcn/ui (Radix UI)
  - TanStack Query (React Query)
  - React Hook Form + Zod
  - React Router DOM
  - Recharts, date-fns
- Backend
  - Node.js 20 + Express.js
  - MongoDB + Mongoose
  - JWT auth (HttpOnly cookie) + bcryptjs
  - Zod + express-validator
  - CORS (credentials), cookie-parser, helmet, morgan
- Infrastructure
  - AWS Lambda + API Gateway (HTTP API)
  - serverless-http
  - Region: ap-southeast-1
  - Frontend hosting: Vercel
- Utilities
  - XLSX (Excel export)
  - Axios (withCredentials)

## Features

- Time tracking: clock in/out, active vs. completed status, monthly/date range filters, precise hours computation
- PTO management: request, approve/deny, search and status filters
- User management: roles, profile update, password change with current-password validation
- Admin time logs: search, pagination, filters; export all matching logs to Excel
- Export to Excel: PTO table and Time Logs with correct headers, binary transfer, and timezone-aware formatting
- Authentication: register/login/logout via JWT in secure HttpOnly cookie (secure, sameSite=none)
- Security and reliability: Helmet headers, CORS with credentials, validation, structured errors, /health endpoint
- UI/UX: responsive design, dark/light theme, charts, toasts, modals
