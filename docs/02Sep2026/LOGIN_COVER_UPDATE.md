# Thailand reference-experience login cover

**Release:** 0.9.1-prototype  
**Source instruction:** `prototype/02Sep2026/GRP_THAILAND_SIRVIR_SA.docx` in the parent workspace

## Design outcome

- Presents the prototype as a **Thailand reference experience**, not a required frontend for every Hub.
- Uses the first supplied Thailand flood-planning image as decorative cover artwork over the navy/teal identity panel.
- Keeps essential meaning in accessible HTML text rather than embedding it in the artwork.
- Retains the SERVIR Global Collaborative identity and visible illustrative/not-for-operational-use boundary.
- Keeps authorised Admin login and one-click demo Planner access unchanged.
- Retains the desktop two-panel composition.
- Prioritises the login form on mobile and hides the nonessential artwork.

## Files

- `public/index.html` — revised login wording and decorative image element
- `public/auth.css` — responsive cover composition and login-card presentation
- `public/i18n.js` — Thai translations for new login wording
- `public/auth.js` — matching demo-button display text only; no authentication behavior change
- `public/assets/thailand-flood-planning-cover.webp` — web-optimised copy of supplied image 1
- `Caddyfile` — cache policy includes WebP assets

## Validation

- Docker Compose images rebuilt successfully.
- Frontend and backend containers became healthy.
- Desktop review at 1440 × 900.
- Mobile review at 390 × 844.
- Demo Planner button completed authentication and opened the planning workspace.
- Browser console showed no errors.
- Existing authentication routes, session handling and role permissions were not changed.

## Screenshots

- [Desktop login cover](screenshots/login-cover-desktop.png)
- [Mobile login cover](screenshots/login-cover-mobile.png)
