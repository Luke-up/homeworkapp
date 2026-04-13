# Frontend styling (SCSS)

The UI is mostly **Sass (SCSS)** with a small set of **global design tokens** and **colocated** component styles.

## Global tokens

**File:** `frontend/src/styles/global.scss`

Brand variables used across the app:

- **`$PrimaryColor`** — deep purple (`#36006C`); primary actions and accents in some components.
- **`$SecondaryColor`** — gold (`#8F8100`); star ratings, links, live-demo link, assignment status icons on the student dashboard.
- **`$DarkColor`**, **`$LightColor`**, **`$TextColor`** — neutrals for surfaces and secondary text.

**Teaching point:** importing `global.scss` into feature SCSS files (via `@import '../../styles/global.scss';`) makes tokens available without duplicating hex codes.

## Patterns

1. **Page-level SCSS** — e.g. `school-dashboard.scss`, `dashboard-page.scss` next to `page.jsx` in the same folder or under `styles/`.
2. **Component SCSS** — e.g. `StudentDashboardAssignments/student-dashboard-assignments.scss` imported from the component JS.
3. **Auth / home** — `auth-pages.scss`, `homepage.scss` imported from app entry pages.

## Accessibility and focus

`global.scss` includes **focus resets** for inputs/buttons (outline removed—ensure visible focus is restored via custom styles where needed for WCAG).

## Next.js + global CSS

**`app/layout.js`** imports **`globals.css`** (and may chain other global entry points). Component SCSS is typically **imported from the component** so webpack/sass splits bundles sensibly.

## Related reading

- `frontend-components.md` — which components own which visual blocks.
- `frontend-pages.md` — layout shells that set page chrome.
