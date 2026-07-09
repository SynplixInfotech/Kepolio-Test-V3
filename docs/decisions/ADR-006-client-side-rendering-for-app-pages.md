# ADR-006: Client-Side Rendering for App Pages

## Status
Accepted

## Date
2026-07-08

## Context
App pages (dashboard, auth, explore, profile) need to:
- Check authentication state before rendering
- Fetch user data from Firestore
- Handle loading states and error states
- Update UI reactively when data changes

We needed to decide between server-side rendering, static generation with hydration, or pure client-side rendering.

## Decision
Use pure client-side rendering for all app pages. HTML provides the structure; JS fetches data and populates the DOM.

## Alternatives Considered

### Static Generation + Hydration (Next.js/Astro)
- Pros: Faster initial paint, better SEO for public profiles
- Cons: Requires build step; hydration complexity; data would still need client-side fetching for real-time updates
- Rejected: Build overhead not justified; public profiles can still be indexed with meta tags

### Server-Side Rendering
- Pros: Fastest FCP, full SEO
- Cons: Requires Node runtime; adds deployment complexity; contradicts the static-site decision (ADR-001)
- Rejected: Incompatible with zero-runtime-cost goal

### Islands Architecture
- Pros: Partial hydration, lighter than full SPA
- Cons: Still requires build tooling; adds conceptual complexity
- Rejected: Same as above

## Consequences
- HTML pages ship with skeleton structure and loading indicators
- JS modules (`auth.js`, `data-service.js`, `dashboard-*.js`) fetch data and populate DOM on load
- Firestore's `onSnapshot` listeners provide real-time updates without page refreshes
- Trade-off: Slower initial paint on app pages (mitigated by skeleton loaders)
- Trade-off: No SEO for app pages (acceptable — dashboard is private; auth pages don't need indexing)
- Public profile pages (`/@:username`) benefit from meta tags in the static HTML for social sharing
