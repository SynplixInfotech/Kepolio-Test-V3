# ADR-004: Vanilla JavaScript (No Framework)

## Status
Accepted

## Date
2026-07-08

## Context
The application consists of:
- A marketing landing page with animations and scroll effects
- Auth pages (login, signup, forgot password)
- A dashboard for managing portfolio items
- A public explore page for browsing profiles
- Public profile pages

We needed to decide whether to use a JS framework (React, Vue, Svelte) or vanilla JS.

## Decision
Use vanilla JavaScript with an IIFE module pattern for all client-side code.

## Alternatives Considered

### React (Next.js or Vite)
- Pros: Component model, large ecosystem, TypeScript support
- Cons: Bundle overhead for simple pages; hydration complexity; build step for all pages
- Rejected: App pages are simple enough that React adds complexity without proportional benefit

### Vue 3
- Pros: Lighter than React, good template syntax
- Cons: Still adds ~30KB bundle; team productivity is higher with vanilla for this scope
- Rejected: Same rationale as React

### Svelte
- Pros: Compile-time, smallest bundle, closest to vanilla
- Cons: Requires build tooling; learning curve for team; less ecosystem maturity
- Rejected: Vanilla JS with IIFE modules achieves the same goal with zero build step

## Consequences
- Zero bundle overhead — each page loads only the JS it needs
- No build step for application code (only `generate-env.js` for env injection)
- IIFE module pattern (`AuthService`, `DataService`, etc.) provides namespace isolation without a module bundler
- Code is straightforward to read for any developer familiar with vanilla JS
- Trade-off: No component reuse between pages; each page is self-contained
- Trade-off: No TypeScript — type safety relies on JSDoc comments and discipline
