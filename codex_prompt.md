# Professional Codex Prompt (Zenith SaaS Quality)

Design and engineer this product as a premium Silicon Valley SaaS platform.

## Product Direction
- Visual tone: dark, elegant, intelligent, investor-ready.
- UX goals: zero clutter, strong hierarchy, generous spacing, and confident conversion flow.
- Brand feel: premium + trustworthy + technical.

## UI Requirements
- Layered animated gradient background (deep navy/black + subtle violet energy glow).
- Subtle animated grid/particle motion in the background.
- Glassmorphism panels with controlled blur, thin borders, and soft depth.
- Scroll reveal animations and smooth transitions.
- Polished micro-interactions for hover, focus, and CTA states.
- Typography: Inter/Poppins style with enterprise-level readability.

## Product Structure
- Home: Hero, Features, AI Showcase, Testimonials, CTA.
- Auth: register/login/logout with strict validation and clean UX messaging.
- Profile menu: Profile, Settings, Logout.
- Role rendering: owner-only controls must never appear for client users.

## Owner/Admin Expectations
- Owner authenticates with pre-approved credentials.
- Owner Dashboard includes:
  - Analytics summary,
  - User management (view/delete users except owner),
  - AI training panel (manual + URL training),
  - Homepage content editor.
- Enforce server-side authorization checks for all owner endpoints.

## AI Model Expectations
- Model must support:
  - Context-aware responses,
  - Conversation memory,
  - Knowledge training from owner input,
  - URL-based knowledge ingestion.
- Show model state in UI: Online, Thinking, Trained.
- Architect AI logic in modular, maintainable backend functions.

## Engineering Standards
- Separate concerns across frontend modules and backend endpoints.
- Keep code scalable, readable, and production-oriented.
- Add robust validation and error handling.
- Deliver responsive quality on desktop and mobile.
