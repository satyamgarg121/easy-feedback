# 📢 Awaaz: Raise it. Get it fixed.

File a civic complaint in about 60 seconds, with no app, no login and no backend.

**Live flow:** pick an issue → snap a photo → auto-pin location → tap what's wrong → get a
ready-to-send complaint with a geo-tagged, time-stamped evidence photo, sent to the right
authority over X, WhatsApp, email or the native share sheet.

Complaint types in v1: **🗑️ Garbage** and **🚧 Broken roads**.

**Live photos only:** the camera opens inside the page (`getUserMedia`). There is no file
picker, so gallery or downloaded photos can't be used. Every evidence photo is stamped
"Live photo" with its capture time and GPS location.

## Official channels (verified 2026-10-04)

| City | Garbage | Roads |
|---|---|---|
| Delhi | MCD: online form, 155305 | < 60 ft: MCD · ≥ 60 ft: PWD (complaint@pwddelhi.gov.in, WhatsApp bot 81301 88222, 1908) |
| Mumbai | BMC WhatsApp bot 89992 28999, 1916 | Same bot (starts with "Pothole"), 1916 |
| Bengaluru | GBA (ex-BBMP) WhatsApp 94806 85700, Sahaaya 1533 | Same |
| Kolkata | KMC WhatsApp 83359 88888, bot 83359 99111, 1800-345-3375 | Same |
| Any highway | | NHAI 1033 |

Other cities fall back to X tagging and the national portals. Sources are noted in `authorities.js`.

## Run locally

```sh
python -m http.server 5173     # or: npx http-server -p 5173
```

Open http://localhost:5173. Geolocation and camera need `localhost` or HTTPS.
To try it on your phone, deploy it (below), because phones can't reach your laptop's `localhost`.

## Deploy (free, static)

It's just 4 static files. Drop the folder on **GitHub Pages**, **Netlify** or **Cloudflare Pages**.

## How it works (no database)

| Piece | Where |
|---|---|
| Complaint types, problems, follow-up questions, official portals | `authorities.js` → `ISSUES` |
| City → civic body + X handles | `authorities.js` → `CITIES` |
| Wizard, letter/X-post generation, photo stamping, accountability ledger | `app.js` |
| "My complaints" (day counter, escalate, mark fixed, thank publicly) | browser `localStorage` only |
| Address lookup from GPS | OpenStreetMap Nominatim (free, no key) |

**Add a city:** append to `CITIES`. **Add a complaint type:** add a key to `ISSUES`, and the home screen picks it up.

## ⚠️ Before going public

- Re-check the official channels every few months; civic bodies rename and restructure (BBMP → GBA in 2025).
- X handles (@MCD_Delhi, @mybmc, @GBA_office, @kmc_kolkata) were seen on X but not checked against official sites.
- For heavy traffic, swap Nominatim for a geocoder whose usage policy allows it.

## Ideas for v2

- Hindi + regional languages
- Footpath encroachment, traffic jams, streetlights, water leakage
- Auto-submit into official portals where APIs exist
- Public, anonymous "unfixed issues" map (this one *would* need a backend)
