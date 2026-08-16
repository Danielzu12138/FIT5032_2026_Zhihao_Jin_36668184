# MindSpace Youth Cloud Deployment

## Architecture

- Cloudflare Pages hosts the Vue 3 application.
- Cloudflare Pages Functions provide server-side REST endpoints.
- Firebase Authentication provides email/password accounts and email verification.
- Firestore stores profiles, bookings, ratings and saved resources.
- Resend sends the administrator summary email with a CSV attachment.

## Cloudflare Pages build settings

Because the Vue project is inside the repository's `MindSpace_Youth` folder, use:

```text
Production branch: main
Framework preset: Vue
Root directory: MindSpace_Youth
Build command: npm run build
Build output directory: dist
```

The `functions` folder is deployed automatically with the Pages project.

## Cloudflare environment variables

Open the Pages project, then go to Settings, Variables and Secrets. Add the values to both
Production and Preview when preview deployments need the APIs.

```text
FIREBASE_PROJECT_ID=mindspace-youth
ALLOWED_ORIGINS=https://fit5032-2026-zhihao-jin-36668184.pages.dev
RESEND_FROM_EMAIL=MindSpace Youth <onboarding@resend.dev>
```

Add this value as an encrypted secret:

```text
RESEND_API_KEY=<key created in the Resend dashboard>
```

Do not put `RESEND_API_KEY` in Vue source code, `.env.example`, or GitHub.

The Resend test sender can normally send only to the email address associated with the Resend
account. To send to other addresses, verify a domain in Resend and replace `RESEND_FROM_EMAIL`.

## Firebase Authentication

1. Enable Email/Password in Authentication, Sign-in method.
2. Add the exact Cloudflare Pages hostname to Authentication, Settings, Authorized domains.
3. Register with a real inbox and click the Firebase verification link before logging in.
4. The public form always creates `role: young_user`.
5. Assign an administrator only in Firestore. The users document ID and `uid` field must equal the
   Firebase Authentication UID, and `role` must be `admin`.
6. Deploy the updated rules, which require a verified email for protected Firestore operations:

```bash
firebase use mindspace-youth
firebase deploy --only firestore:rules
```

## Functions and REST routes

```text
GET  /api/health
GET  /api/resources
POST /api/check-booking
POST /api/send-email
```

`check-booking` and `send-email` require a valid Firebase ID token from an email-verified user.
`send-email` also checks the protected Firestore profile and permits administrators only. The
administrator email is read from Firestore, so the browser cannot select an arbitrary recipient.

The attached email report contains aggregate totals only. Individual names, emails, support
services and booking records are not sent to Resend.

## Deployment checks

After pushing the changes to `main`, confirm:

1. The latest Cloudflare Pages deployment is successful.
2. `/api/health` returns JSON containing `"status":"ok"`.
3. A new user receives and completes the verification email.
4. An unverified user is denied login and can resend verification.
5. Forgot password sends a Firebase reset email.
6. A verified administrator can send the summary CSV from Admin Dashboard.
7. A normal young user cannot access the admin page or email function.
