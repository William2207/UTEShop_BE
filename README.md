# Backend (Express + MongoDB + JWT)

## Quick start
1. Copy `.env.example` to `.env` and update values.
2. Install deps: `npm install`
3. Run: `npm start`

## Routes
- `POST /api/auth/register` { name?, email, password }
- `POST /api/auth/login` { email, password }
- `GET /api/auth/me` (Authorization: Bearer <token>)
