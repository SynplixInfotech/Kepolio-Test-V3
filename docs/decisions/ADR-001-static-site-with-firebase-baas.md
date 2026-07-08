# ADR-001: Static Site with Firebase BaaS

## Status
Accepted

## Date
2026-07-08

## Context
KePolio is a student portfolio platform that needs:
- Public-facing marketing site (landing page, about, blog)
- Authenticated app experience (dashboard, profile management)
- Public profile pages accessible via shareable links
- Low operational overhead for a small team

We needed to choose between a full-stack framework (Next.js, Nuxt), a static site generator, or a pure static approach with a backend-as-a-service.

## Decision
Use a vanilla HTML/CSS/JS static site deployed on Vercel, with Firebase as the backend (Auth, Firestore, Storage).

## Alternatives Considered

### Next.js + Server Routes
- Pros: SSR for SEO, API routes, React ecosystem
- Cons: Overkill for a portfolio site; adds build complexity, Node runtime costs, and deployment overhead
- Rejected: The app pages (dashboard, auth) are client-rendered anyway; marketing pages don't need SSR

### Nuxt / SvelteKit
- Pros: Similar SSR benefits, lighter than Next.js
- Cons: Same overhead concerns; team is more productive with vanilla JS
- Rejected: Same rationale as Next.js

### Pure static with no backend
- Pros: Simplest possible deployment
- Cons: No auth, no data persistence, no user accounts
- Rejected: Core feature requires user accounts and data storage

## Consequences
- Zero server runtime costs; Vercel serves static files from CDN
- Firebase handles auth, database, and storage with generous free tier
- No build step required for the site itself (only `generate-env.js` for Vercel deploys)
- Client-side rendering for app pages is acceptable (portfolio audiences are not SEO-sensitive for dashboard pages)
- Marketing pages are pure HTML with no JS framework overhead
