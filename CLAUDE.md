# Notes for Claude Code

Personal fitness + finance PWA ("Second Brain v2"). Single user, English UI, CHF, Europe/Zurich, weeks start Monday.

## Rules
- Stack: React 19 + Vite + lucide-react + plain CSS tokens. **Ask before adding dependencies.**
- Colours only via CSS variables in `src/styles/tokens.css`; shared component classes live in `src/styles/base.css`.
- Feature modules don't import each other — cross-feature logic goes into `src/features/coach.js`.
- Pure logic lives in `engine/` files and must be covered in `src/test/engines.test.js`.
- **Evening routines in `src/features/routines/programs.js` are accepted by the user — do not change exercises, order or timings without asking.**
- Back care (Scheuermann): keep `spine` ratings on exercises accurate; new exercises need one.
- Keep files under ~400 lines; split when they grow.

## Before committing
`npm test && npm run lint && npm run build` must pass. Pushing to `main` deploys to Netlify.
