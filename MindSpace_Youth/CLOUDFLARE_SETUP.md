# MindSpace Youth Cloud Deployment

## Architecture

- Cloudflare Pages hosts the Vue 3 application.
- Cloudflare Pages Functions provide server-side REST endpoints.
- Firebase Authentication creates email/password accounts and sends verification and reset links.
- Firestore stores verified user profiles, bookings, ratings and saved resources.
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

Open the Pages project, then go to Settings, Variables and Secrets. Add the values to Production.
Add them to Preview too only when preview deployments need the APIs.

```text
FIREBASE_PROJECT_ID=mindspace-youth
ALLOWED_ORIGINS=https://fit5032-2026-zhihao-jin-36668184.pages.dev
RESEND_FROM_EMAIL=MindSpace Youth <onboarding@resend.dev>
```

Add this value as an encrypted secret:

```text
RESEND_API_KEY=<key created in the Resend dashboard>
```

Do not put `RESEND_API_KEY` in Vue source code, committed environment files, or GitHub. The Resend
test sender can normally send only to the email address associated with the Resend account. A
verified sender domain is required to send administrator reports to other addresses.

Registration and password-reset emails are sent by Firebase, not Resend. The registration flow no
longer needs `REGISTRATION_CODES`, `OTP_PEPPER`, `FIREBASE_CLIENT_EMAIL`,
`FIREBASE_PRIVATE_KEY`, or `FIREBASE_WEB_API_KEY` in Cloudflare.

## Firebase Authentication

1. Enable Email/Password in Authentication, Sign-in method.
2. Add `fit5032-2026-zhihao-jin-36668184.pages.dev` to Authentication, Settings, Authorized domains.
3. Review Authentication, Templates, Email address verification. Firebase sends this link from its
   managed authentication sender.
4. Registration creates only an unverified Firebase Auth account and sends the verification link.
   It does not create a Firestore `users` document.
5. After the user opens the verification link and signs in, the application creates
   `users/{uid}` with the fixed role `young_user`.
6. Assign an administrator only in Firestore. The document ID and `uid` field must equal the
   Firebase Authentication UID, and `role` must be `admin`.
7. Deploy the rules, which require a verified email for protected Firestore operations:

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

The attached report contains aggregate totals only. Individual names, emails, support services and
booking records are not sent to Resend.

## Global booking conflicts

Every new appointment is written with a deterministic `booking_slots/{date_time}` lock in the same
Firestore transaction. The transaction first reads the global lock; if another user creates it
concurrently, Firestore retries the transaction and rejects the second booking. Firestore Rules
also require the booking and lock documents to reference each other, so neither can be created
independently by a normal user.

Bookings created before this feature do not have slot-lock documents. Before final testing, remove
old mock bookings from the `bookings` collection, or manually create matching `booking_slots`
documents using IDs such as `2026-08-20_09:30`. New bookings create locks automatically.

## Deployment checks

After pushing the changes to `main`, confirm:

1. The latest Cloudflare Pages deployment is successful.
2. `/api/health` returns JSON containing `"status":"ok"`.
3. Registration creates an unverified Auth account but no Firestore `users` document.
4. The real inbox receives and opens the Firebase verification link.
5. The first verified login creates one `young_user` Firestore profile.
6. An unverified login is denied and can resend the Firebase verification email.
7. Forgot password sends a Firebase reset email.
8. A verified administrator can send the summary CSV from Admin Dashboard.
9. A normal young user cannot access the admin page or email Function.
10. Two accounts submitting the same date and time result in one success and one conflict message.
