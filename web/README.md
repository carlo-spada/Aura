## AURA Web (Next.js)

Dev
- `npm install`
- `export NEXT_PUBLIC_API_URL=http://localhost:8000`

## Auth setup (NextAuth)

Set these in `web/.env.local` (copy from `.env.example`):

- Core
  - `NEXTAUTH_URL` (dev: `http://localhost:3000`)
  - `NEXTAUTH_SECRET` (generate a strong random string)
- Google OAuth
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - In Google Cloud Console, add the redirect URL: `http://localhost:3000/api/auth/callback/google` (dev) and `https://<your-domain>/api/auth/callback/google` (prod)
- Email (magic link)
  - `EMAIL_SERVER` (SMTP URI) and `EMAIL_FROM`
  - Works with Mailgun/SendGrid/Resend SMTP, or Gmail with an App Password
- Optional: GitHub OAuth

Providers are enabled only when their env vars are present. Google and Email are recommended.
- `npm run dev` → http://localhost:3000

Build
- `npm run build` then `npm start`

Env
- `NEXT_PUBLIC_API_URL` must point to your FastAPI origin in production, e.g. `https://api.aura.carlospada.me`.
