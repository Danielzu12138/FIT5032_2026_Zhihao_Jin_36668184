# MindSpace Youth Cloud Deployment

## Architecture

- Cloudflare Pages hosts the Vue 3 application.
- Cloudflare Pages Functions provide server-side REST endpoints.
- Cloudflare KV temporarily stores hashed, expiring registration codes.
- Resend delivers six-digit registration codes and administrator report emails.
- Firebase Authentication stores email/password accounts only after code verification succeeds.
- Firestore stores profiles, bookings, ratings and saved resources.

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
FIREBASE_WEB_API_KEY=AIzaSyCz8MIJQGq8TVZQ4VdEq6umMaYgh16n4nI
FIREBASE_CLIENT_EMAIL=<client_email from the Firebase service-account JSON>
ALLOWED_ORIGINS=https://fit5032-2026-zhihao-jin-36668184.pages.dev
RESEND_FROM_EMAIL=MindSpace Youth <verify@your-verified-domain.example>
```

Add these values as encrypted secrets, not plain-text variables:

```text
RESEND_API_KEY=<key created in the Resend dashboard>
OTP_PEPPER=<a long random secret, for example the output of openssl rand -base64 32>
FIREBASE_PRIVATE_KEY=<private_key from the Firebase service-account JSON>
```

When pasting `FIREBASE_PRIVATE_KEY`, include the complete `-----BEGIN PRIVATE KEY-----` and
`-----END PRIVATE KEY-----` value, without the surrounding JSON quotation marks. Both real line
breaks and escaped `\n` characters are accepted.
Never put service-account JSON, `RESEND_API_KEY`, `OTP_PEPPER`, or `FIREBASE_PRIVATE_KEY` in Vue
source code, `.env` files committed to Git, or GitHub settings visible to the browser build.

The Resend test sender can normally send only to the email address associated with the Resend
account. To send to other addresses, verify a domain in Resend and replace `RESEND_FROM_EMAIL`.

## Cloudflare KV binding

1. In Cloudflare, open Storage & Databases, KV, and create a namespace named
   `mindspace-registration-codes`.
2. Open Workers & Pages, select this Pages project, then open Settings, Bindings.
3. Add a KV namespace binding. Its variable name must be exactly `REGISTRATION_CODES` and its
   namespace must be `mindspace-registration-codes`.
4. Add the binding to Production. Add it to Preview too when preview deployments need registration.
5. Redeploy the Pages project after saving bindings, variables or secrets.

KV stores only a challenge ID, normalized email, display name, HMAC hash, expiry and failed-attempt
count. It never stores the password or the plain six-digit code. Challenges expire after 10 minutes.

## Firebase Authentication

1. Enable Email/Password in Authentication, Sign-in method.
2. Add the exact Cloudflare Pages hostname to Authentication, Settings, Authorized domains.
3. Open Project settings, Service accounts, Firebase Admin SDK, then select Generate new private
   key. Copy only `client_email` and `private_key` into the Cloudflare settings described above.
   Delete the downloaded JSON from the computer after configuring Cloudflare; never commit it.
4. The generated service account must be able to manage Firebase Authentication users and write
   Firestore documents. If the Functions logs return HTTP 403, grant it Firebase Authentication
   Admin and Cloud Datastore User in Google Cloud IAM.
5. Registration first sends a Resend code. Firebase Auth and the `users/{uid}` Firestore profile are
   created only after the correct code is submitted. The server fixes every new role to
   `young_user` and marks the Auth email as verified.
6. Assign an administrator only in Firestore. The users document ID and `uid` field must equal the
   Firebase Authentication UID, and `role` must be `admin`.
7. Deploy the updated rules, which require a verified email for protected Firestore operations:

```bash
firebase use mindspace-youth
firebase deploy --only firestore:rules
```

## Functions and REST routes

```text
GET  /api/health
GET  /api/resources
POST /api/check-booking
POST /api/start-registration
POST /api/complete-registration
POST /api/send-email
```

`start-registration` checks email syntax, blocks common disposable domains, checks the domain's MX
records, applies request limits, stores a hashed code in KV and asks Resend to send the code.
`complete-registration` permits five code attempts and creates the Auth and Firestore records only
after a correct, unexpired code.

`check-booking` and `send-email` require a valid Firebase ID token from an email-verified user.
`send-email` also checks the protected Firestore profile and permits administrators only. The
administrator email is read from Firestore, so the browser cannot select an arbitrary recipient.

The attached email report contains aggregate totals only. Individual names, emails, support
services and booking records are not sent to Resend.

## Deployment checks

After pushing the changes to `main`, confirm:

1. The latest Cloudflare Pages deployment is successful.
2. `/api/health` returns JSON containing `"status":"ok"`.
3. An invalid or non-mail domain is rejected without creating Auth or Firestore records.
4. A real inbox receives the six-digit code and an incorrect code is rejected.
5. A correct code creates one verified Firebase Auth account and one `young_user` Firestore profile.
6. Resend is rate-limited for one minute and expired codes cannot be reused.
7. Forgot password sends a Firebase reset email.
8. A verified administrator can send the summary CSV from Admin Dashboard.
9. A normal young user cannot access the admin page or email function.

## Known platform limitation

The application registration page cannot create Firebase or Firestore records before OTP proof.
Firebase Email/Password is still a public sign-up provider, so a person deliberately calling the
Firebase REST sign-up API could create an unverified Auth-only record outside this application.
Firestore rules prevent that record from reading or writing protected application data. Completely
disabling public Firebase sign-up requires Identity Platform blocking functions or switching the
application to custom-token authentication.
