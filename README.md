# KePolio

**Know Everyone's Portfolio** — a portfolio showcase platform for students across all streams. Build your profile, add your work, and share it with recruiters instantly.

## Live Demo

**[kepolio.vercel.app](https://kepolio.vercel.app)**

## Features

- **Multi-stream profiles** — Arts, Commerce, Science, Engineering, and more
- **Public portfolio pages** — Shareable via clean URLs (`/@username`)
- **Case codes** — Unique shareable codes (`KEP-XXXXX`) for quick profile access
- **Light/dark theme** — System-aware with manual toggle
- **Fully static** — No server runtime; Firebase handles auth, database, and storage
- **Mobile-first** — Responsive across all devices

## Quick Start

```bash
# Clone the repo
git clone https://github.com/SynplixInfotech/KePolio---Know-Everyone-s-Portfolio.git
cd KePolio---Know-Everyone-s-Portfolio

# Serve locally
npx serve .
```

Open `http://localhost:3000` in your browser.

### Firebase Setup (required for auth & dashboard)

1. Copy the example config:
   ```bash
   cp public/js/firebase-env.example.js public/js/firebase-env.js
   ```
2. Fill in your Firebase project credentials in `firebase-env.js`
3. Or set Vercel environment variables (see [Deployment](#deployment))

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Generate `firebase-env.js` from Vercel env vars |
| `npx serve .` | Start local static file server |
| `firebase deploy --only firestore:rules` | Deploy Firestore security rules |

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JS (no framework), CSS custom properties |
| Backend | Firebase Auth + Firestore (BaaS) |
| Image uploads | Cloudinary |
| Hosting | Vercel (CDN, clean URLs, security headers) |

### Project Structure

```
├── index.html                  # Marketing landing page
├── main.js                     # Landing page animations & interactions
├── styles.css                  # Design system & landing page styles
├── public/
│   ├── auth.html               # Login / Signup pages
│   ├── dashboard.html          # User dashboard
│   ├── explore.html            # Browse public profiles
│   ├── profile.html            # Public profile page (/@:username)
│   ├── about.html              # About page
│   ├── blog.html               # Blog page
│   ├── careers.html            # Careers page
│   ├── privacy.html            # Privacy policy
│   ├── terms.html              # Terms of service
│   ├── css/                    # Page-specific styles
│   │   ├── shared.css          # Shared design tokens & base styles
│   │   ├── auth.css            # Auth page styles
│   │   ├── dashboard.css       # Dashboard styles
│   │   ├── explore.css         # Explore page styles
│   │   ├── profile.css         # Profile page styles
│   │   ├── pages.css           # Static page styles (about, blog, etc.)
│   │   └── loader.css          # Loading spinner styles
│   ├── js/                     # Application JavaScript
│   │   ├── firebase-config.js  # Firebase initialization
│   │   ├── firebase-env.js     # Firebase config (gitignored, generated)
│   │   ├── auth.js             # Authentication service
│   │   ├── auth-page.js        # Auth page UI logic
│   │   ├── data-service.js     # Firestore CRUD operations
│   │   ├── dashboard.js        # Dashboard page logic
│   │   ├── explore.js          # Explore page logic
│   │   ├── profile.js          # Profile page logic
│   │   ├── cloudinary.js       # Image upload via Cloudinary
│   │   ├── theme.js            # Theme switching (light/dark)
│   │   ├── loader.js           # Page loading spinner
│   │   └── utils.js            # Shared utility functions
│   └── logo/                   # Logo assets
├── docs/decisions/             # Architecture Decision Records
├── scripts/
│   ├── generate-env.js         # Inject Firebase config from Vercel env vars
│   └── generate-report.js      # Generate reports
├── vercel.json                 # Vercel deployment config (rewrites, headers)
├── firebase.json               # Firebase project config
└── firestore.rules             # Firestore security rules
```

### Firestore Data Model

```
users/{uid}
  ├── projects/{projectId}
  ├── certificates/{certId}
  ├── qualifications/{qualId}
  └── experiences/{expId}

caseCodes/{KEP-XXXXX}  → { uid }    # Shareable code lookup
usernames/{username}    → { uid }    # Username lookup
```

Security rules enforce public reads, owner-only writes. See [firestore.rules](firestore.rules).

### Key Design Decisions

- **Static site + Firebase BaaS** — Zero server runtime; Firebase handles auth, database, and storage. See [ADR-001](docs/decisions/ADR-001-static-site-with-firebase-baas.md).
- **Vanilla JS (no framework)** — IIFE module pattern for namespace isolation without a bundler. See [ADR-004](docs/decisions/ADR-004-vanilla-js-no-framework.md).
- **Vercel hosting** — Clean URLs via rewrite rules, CDN delivery, security headers. See [ADR-003](docs/decisions/ADR-003-vercel-hosting-with-rewrites.md).
- **Linear-inspired design** — CSS custom properties for theme switching, Inter typeface, indigo-violet accent. See [ADR-005](docs/decisions/ADR-005-linear-inspired-design-system.md).

Full ADR index: [docs/decisions/](docs/decisions/)

## Deployment

The site deploys automatically to Vercel on push to the `main` branch. The build step only generates `firebase-env.js` from Vercel environment variables.

### Required Vercel Environment Variables

| Variable | Description |
|----------|-------------|
| `FIREBASE_API_KEY` | Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `FIREBASE_APP_ID` | Firebase app ID |
| `FIREBASE_MEASUREMENT_ID` | Firebase measurement ID |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "feat: add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is proprietary. All rights reserved.
