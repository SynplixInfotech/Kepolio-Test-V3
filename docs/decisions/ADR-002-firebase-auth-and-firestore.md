# ADR-002: Firebase Auth and Firestore for Backend

## Status
Accepted

## Date
2026-07-08

## Context
The platform needs:
- User registration and login (email/password + Google SSO)
- User profiles with public/private data (name, username, bio, skills, social links)
- User-owned subcollections: projects, certificates, qualifications, experiences
- A unique shareable code (KEP code) per user
- Username lookup and availability checking
- Profile view counting
- Offline support for better UX

## Decision
Use Firebase Authentication (email/password + Google provider) and Cloud Firestore as the primary datastore.

## Alternatives Considered

### Supabase (PostgreSQL)
- Pros: SQL queries, row-level security, open source
- Cons: Less mature JS SDK; Firebase integrates more seamlessly with Vercel; team has Firebase experience
- Rejected: Firebase's real-time listeners and offline persistence fit the use case better

### MongoDB Atlas
- Pros: Flexible schema, good JS driver
- Cons: No built-in auth; would need separate auth provider; less favorable free tier
- Rejected: Firestore's document model and security rules are a tighter fit

### Custom backend (Express + PostgreSQL)
- Pros: Full control, standard SQL
- Cons: Must manage server, deployments, scaling, auth from scratch
- Rejected: Too much operational overhead for the team size

## Consequences
- Firestore's document model maps naturally to user profiles with subcollections
- Security rules enforce owner-only writes with public reads — no custom API layer needed
- Offline persistence (`enablePersistence`) improves UX on flaky connections
- Firebase config keys are NOT secrets (security enforced by Firestore rules, not key hiding)
- Session-scoped caching in `DataService` reduces redundant Firestore reads
- KEP codes and usernames are stored as separate lookup collections for fast explore/search
