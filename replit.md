# Mafaz Mobility catalog

A bilingual (English/Arabic) catalog site for Mafaz — مركز مفاز للأطراف
الاصطناعية والأجهزة المساندة — a prosthetics and orthotics clinic in Amman,
Jordan. Visitors browse the devices the clinic fits and send a patient referral
to the clinical team.

## Run & Operate

- Production serves as ONE origin: build the client, then start the API server,
  which serves `artifacts/mobility-catalog/dist/public` and mounts the API at
  `/api`. Unknown non-API paths fall through to the app shell so client routes
  such as `/catalog/prosthetics` work on a cold load. Override the build
  location with `CLIENT_DIST`. Serving the page from a different origin to the
  API breaks referrals, because the form posts to a relative `/api/referrals`.

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `node scripts/generate-sitemap.mjs` — after the client build; see **Going live**
- Required env: `DATABASE_URL` — Postgres connection string
- Referral email (optional, but referrals are only emailed when set):
  - `SMTP_URL` — e.g. `smtps://user:pass@smtp.example.com:465`, or set
    `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` individually
  - `REFERRAL_INBOX` — where referrals are delivered (defaults to
    `info@mafazmedical.com`)
  - `MAIL_FROM` — envelope sender, defaults to the inbox address
  - With none of these set the API records referrals and reports
    `delivered: false`, and the site asks the referrer to send on WhatsApp
    instead, so a referral is never silently lost.

## Going live

One value is still missing before the site is fully launch-ready: the public
origin. Set `SITE_URL` (e.g. `https://mafazmedical.com`) and run
`node scripts/generate-sitemap.mjs` after the client build. It writes
`sitemap.xml`, points `robots.txt` at it, and rewrites the share tags to
absolute URLs. Until it runs, `og:image` stays relative, which is why a link
pasted into WhatsApp shows no logo — the crawler cannot resolve a relative
image. The script exits quietly when `SITE_URL` is unset rather than baking in
a guessed domain.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Client: Vite 7, React, Tailwind v4, wouter for routing, TanStack Query
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — the API contract, source of truth. Change it,
  then run codegen; the client hooks and Zod schemas are generated, never edited.
- `artifacts/api-server/src/routes/catalog.ts` — all catalog content: categories,
  solutions, the per-solution model lists, and the clinic record. This is the
  file to edit when the clinic adds a device.
- `attached_assets/solutions/` — solution photography, discovered by filename.
  A solution with `imageKey: "dafo"` shows `dafo-1.webp`, `dafo-2.webp` … in
  order. See `artifacts/mobility-catalog/src/lib/solution-images.ts`.
- `artifacts/mobility-catalog/src/i18n/language.tsx` — the language provider and
  the `t(en, ar)` helper every component uses.
- `scripts/` — `build-preview.mjs` (single-file shareable build),
  `optimise-solution-images.mjs`, `crop-solution-photo.mjs`,
  `generate-brand-assets.mjs`, `generate-sitemap.mjs`.

## Architecture decisions

- **Bilingual by field, not by file.** There is no translation catalog; every
  data record carries its own `*Arabic` twin (`titleArabic`,
  `descriptionArabic`, `workflowArabic`, `addressArabic`, `hoursArabic`) and the
  UI falls back to English when one is missing. Adding a device in English alone
  degrades gracefully instead of showing a missing-key placeholder.
- **Catalog content lives in code, not the database.** The clinic's catalog
  changes a few times a year and is reviewed like code; the database holds only
  submitted referrals.
- **Referrals never dead-end.** The server reports honestly whether it emailed
  the referral (`delivered`), and when it could not, the page hands the referrer
  the composed text with WhatsApp and mailto buttons rather than claiming
  success.
- **Single origin in production**, so the referral POST is same-origin and needs
  no CORS allowance. CORS is otherwise closed by default (`ALLOWED_ORIGINS`).
- **Photography is cropped and re-encoded at commit time**, not resized in the
  browser; the whole solution image set is a few hundred KB.

## Product

- Home: hero, clinic metrics, the two category cards, featured solutions, a
  referral call to action.
- Catalog: search across English and Arabic titles, descriptions and model
  names, plus category and tag filters. Filter state lives in the URL
  (`?q=`, `?cat=`, `?tag=`) so a filtered view can be shared.
- Solution detail: photo gallery, tags, the models fitted under that solution,
  the fitting workflow, and related solutions.
- Referral: a form that emails the clinical team, with WhatsApp as a fallback.
- Contact: clinic address, hours, phone, WhatsApp, email, map link.
- Every page works in English and Arabic, with full RTL.

## User preferences

- The clinic is an authorised Ottobock distributor, so Ottobock product imagery
  may be published.
- WhatsApp: +962 79 518 5080. Clinic email: info@mafazmedical.com.
- Device descriptions state only what is visible in the photograph and make no
  clinical claim; candidacy copy always routes the reader to the clinic.
- The outcomes page is parked, not deleted — see the comment above the
  `Outcomes` component in `App.tsx` for what to restore.

## Gotchas

- Edit `openapi.yaml` and run codegen **before** using a new field in the client;
  the generated types are what the client compiles against.
- `vite build` does not typecheck. Run `pnpm run typecheck` as well.
- The preview build (`scripts/build-preview.mjs`) snapshots API GET responses
  into the HTML. Add any new GET route to its snapshot list or the single-file
  preview will show an error state for it.
- Homepage metrics ("25+ years", "4.9/5 patient experience") are placeholder
  figures inherited from the original scaffold and have nothing behind them yet.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
