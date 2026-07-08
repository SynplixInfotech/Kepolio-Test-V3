# ADR-005: Linear-Inspired Design System

## Status
Accepted

## Date
2026-07-08

## Context
The platform needs a professional, modern design that:
- Works for students across all streams (arts, commerce, science, engineering)
- Supports light and dark modes
- Feels premium and polished (like Linear's marketing site)
- Is implemented entirely in CSS without a component library

## Decision
Adopt a Linear-inspired design system using CSS custom properties, with Inter as the primary typeface and an indigo-violet accent palette.

## Alternatives Considered

### Tailwind CSS
- Pros: Rapid prototyping, utility-first, consistent spacing
- Cons: Requires build step; class-heavy HTML; harder to maintain design tokens as CSS variables
- Rejected: No-build approach is a core constraint; Tailwind needs PostCSS

### Material Design / Chakra UI
- Pros: Well-documented, accessible by default
- Cons: Heavily branded look; requires React/Vue; doesn't match the aesthetic we want
- Rejected: Framework dependency and visual identity mismatch

### Custom CSS with CSS Modules
- Pros: Scoped styles, no runtime cost
- Cons: Requires build tooling; overkill for a static site with a shared design system
- Rejected: Plain CSS with BEM-like naming achieves the same scoping at zero cost

## Consequences
- CSS custom properties (`--bg-primary`, `--accent-blue`, etc.) enable theme switching via `data-theme` attribute
- Light mode is default; dark mode inverts the palette via `[data-theme="dark"]` overrides
- Inter font with aggressive negative letter-spacing at display sizes creates a compressed, authoritative look
- Indigo-violet accent (`#5e6ad2` / `#7170ff`) is the only chromatic color — used sparingly for CTAs and active states
- Glass morphism effects (`backdrop-filter: blur`) for cards and surfaces
- Particle canvas and gradient mesh provide ambient visual interest without framework dependencies
- All animations use CSS transitions/keyframes + `requestAnimationFrame` for the particle system
