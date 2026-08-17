# D, E and F Requirement Evidence

## Category D

| Requirement | Implementation evidence |
| --- | --- |
| D.1 External authentication | Firebase Email/Password Authentication in `src/firebase.js` and `src/utils/auth.js`, including Firebase verification links and password reset. Firestore profiles are created only after verified sign-in. |
| D.2 Email with attachment | Administrator-only `POST /api/send-email` Cloudflare Function sends an aggregate CSV attachment through Resend. The API key remains a Cloudflare secret. |
| D.3 Interactive table data | `InteractiveDataTable.vue` provides global search, individual-column search, sorting and fixed 10-row pagination. Admin Dashboard contains Bookings and Users tables. |
| D.4 Cloud deployment | Vue frontend and Pages Functions are configured for Cloudflare Pages. Deployment settings are documented in `CLOUDFLARE_SETUP.md`. |

## Category E

| Requirement | Implementation evidence |
| --- | --- |
| E.1 Cloud Functions | Cloudflare Pages Functions expose health, resources, booking validation and email routes under `functions/api`. Protected routes verify Firebase ID token signatures and Firestore roles. |
| E.2 Geo location | `SupportMapView.vue` provides support-centre search, selectable map markers and trip distance/time comparison using Leaflet and OpenStreetMap. |
| E.3 Accessibility | Skip link, semantic landmarks, keyboard-accessible forms and tables, explicit labels, ARIA live messages, alternative text and reduced-motion styles are included. Run a final WCAG 2.1 AA audit against the deployed URL for submission evidence. |
| E.4 Export | Admin Dashboard exports Bookings and Users as CSV files. |

## Category F: implemented innovations

1. Appointment calendar: FullCalendar day/week/month views, 30-minute constraints, future-date checks and conflict handling.
2. Interactive analytics: Chart.js graphs are generated from Firestore ratings and booking status data.
3. Admin dashboard: role-protected user, booking, rating, export and aggregate-email tools.
4. Offline support: online/offline detection and persistent Local Storage booking drafts.
5. REST API access: `GET /api/health` and `GET /api/resources` are public third-party routes; protected POST routes provide additional server-side functionality.

## Recommended future upgrades

- Move global booking-slot ownership into a dedicated server-managed collection for atomic conflict prevention across all users.
- Add consent-based bulk email preferences before implementing campaign email.
- Add automated accessibility testing in continuous integration and repeat manual screen-reader testing.
- Replace the static support-centre dataset with an approved live provider directory while retaining a privacy-preserving local search mode.
