# 📢 Awaaz: Raise it. Get it fixed.

File a civic complaint in about 60 seconds, with no app, no login and no backend.

**Live flow:** pick an issue → snap a photo → auto-pin location → tap what's wrong → get a
ready-to-send complaint with a geo-tagged, time-stamped evidence photo, sent to the right
authority over X, WhatsApp, email or the native share sheet.

Complaint types in v1: **🗑️ Garbage** and **🚧 Broken roads**.

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

- Verify every X handle in `CITIES` (all are marked `verify: true`). Civic bodies rename and restructure.
- For heavy traffic, swap Nominatim for a geocoder whose usage policy allows it.

## Ideas for v2

- Hindi + regional languages
- Footpath encroachment, traffic jams, streetlights, water leakage
- Auto-submit into official portals where APIs exist
- Public, anonymous "unfixed issues" map (this one *would* need a backend)
