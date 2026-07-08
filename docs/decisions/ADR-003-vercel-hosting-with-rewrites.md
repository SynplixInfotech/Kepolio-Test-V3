# ADR-003: Vercel Hosting with Rewrite Rules

## Status
Accepted

## Date
2026-07-08

## Context
The site needs:
- Fast global CDN delivery
- Clean URLs (`/explore`, `/dashboard`, `/auth`) instead of `/public/explore.html`
- Security headers (X-Frame-Options, CSP-adjacent headers, referrer policy)
- Cache control for static assets vs. HTML pages
- Zero-config deployment from Git

## Decision
Deploy on Vercel with `vercel.json` rewrites mapping clean paths to HTML files in `/public/`.

## Alternatives Considered

### Netlify
- Pros: Similar features, generous free tier
- Cons: Rewrite syntax is slightly different; Vercel's edge network is faster for our target regions
- Rejected: Marginal difference; Vercel chosen for ecosystem alignment

### Firebase Hosting
- Pros: Same Firebase ecosystem
- Cons: Less flexible rewrite rules; no edge middleware; separate deployment pipeline from code
- Rejected: Vercel provides better DX for static sites with rewrites

### Cloudflare Pages
- Pros: Fast, generous limits
- Cons: Less mature rewrite configuration; no Vercel-style environment variable injection
- Rejected: Vercel's `installCommand`/`buildCommand` skip pattern works perfectly for static sites

## Consequences
- Clean URLs via rewrites: `/explore` → `/public/explore.html`, `/@:username` → `/public/profile.html?u=:username`
- Static assets (`styles.css`, `main.js`) get immutable caching (`max-age=31536000`)
- HTML pages get `no-cache` to ensure fresh content
- `firebase-env.js` gets `no-store` to prevent stale config caching
- Security headers applied globally: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`
- Build step only runs `generate-env.js` to inject Firebase config from Vercel env vars
