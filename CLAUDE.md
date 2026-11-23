# NEW ERA website (neweradentalcenter.com) — Vercel project `newerawebsite`

- **Source of the site app:** `_src/website.jsx` (React JSX). `index.html` only has the compiled, minified script — the source is NOT embedded in the page anymore.
- **Build after editing the source:** `node _src/build.js` → compiles with esbuild and regenerates the precompiled Tailwind CSS (`<style id="tw">`) using `_src/tw-play-3.js` + `_src/tailwind.config.js`. Bump `SITE_VERSION` in the source on every change.
- `_src/` and this file are excluded from deployment (`.vercelignore`).
- **SEO pages** (branches, services, service+branch, blog, sitemap): `api/seo.js` + `api/_content.js` (+ `api/_blog.js`), server-rendered from Firestore, routed by `vercel.json`.
- Security headers are set in `vercel.json` (`headers`). The site loads React/Firebase from CDNs with SRI `integrity` hashes — if a library version changes, update its hash.
- Reply to the owner in Egyptian Arabic; tell her exactly which files changed.
