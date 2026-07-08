# CASE — Animation Spec

## Entry Sequence (Page Load)

| Step | Delay | Duration | Element | Effect |
|---|---|---|---|---|
| 1 | 0ms | 500ms | Background particles | Fade in, begin drift |
| 2 | 500ms | 800ms | CASE logo | Fade in + blue pulse glow |
| 3 | 1000ms | 1200ms | Tagline typewriter | Character-by-character type |
| 4 | 2000ms | 700ms | Hero headline + CTA | Fade in + translateY(20px→0) |
| 5 | 2500ms | 800ms | Hero mockup panels | Blur(8px→0) + translateY(30px→0) |
| 6 | 3000ms | ongoing | Gradient mesh | Slow hue shift loop |

**Total entry duration: ≤ 3.5 seconds**

---

## Scroll Reveal

```css
/* Initial state (before scroll) */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

/* Triggered when in viewport */
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

**Stagger delay for feature cards:** 100ms per card (card 1: 0ms, card 2: 100ms, card 3: 200ms, card 4: 300ms)

---

## Idle Animations

### Hero Mockup Float
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-12px); }
}
animation: float 6s ease-in-out infinite;
```

### Deploy Progress Bar Loop
```css
@keyframes deployBar {
  0%   { width: 0% }
  70%  { width: 75% }
  80%  { width: 75% }  /* pause at 75% */
  100% { width: 75% }
}
animation: deployBar 3s ease-out forwards;
```

### Particle Field Drift
```css
/* Each particle has random x/y drift + opacity pulse */
@keyframes particleDrift {
  0%   { transform: translate(0, 0) scale(1); opacity: 0.4; }
  50%  { transform: translate(var(--dx), var(--dy)) scale(1.2); opacity: 0.7; }
  100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
}
/* duration: random between 8s–15s per particle */
```

---

## Micro-Interactions

| Element | Trigger | Effect |
|---|---|---|
| Primary button | hover | scale(1.02) + glow shadow 20px |
| Secondary button | hover | border-color → accent blue |
| Feature card | hover | translateY(-4px) + border glow |
| Step card (Deploy) | always | stronger blue border + slight elevation |
| Nav link | hover | color → white + underline slide-in |

---

## Easing Reference

| Name | Value | Use |
|---|---|---|
| Smooth out | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances |
| Gentle | `ease` | General transitions |
| Spring-like | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Button hover |
