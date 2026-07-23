# CLAUDE.md

## Project

Sound Search is a React + TypeScript application using Mixcloud through a
provider-neutral API boundary.

## Commands

```bash
npm run lint
npm test
npm run build
npm run dev
```

Run lint, tests, and build before considering a change complete.

## Architecture Rules

- Keep provider-specific HTTP payloads and widget URL logic inside `src/api/`.
- Keep provider-neutral types and pure business rules in `src/domain/`.
- Access localStorage only through `src/storage/`.
- Use React Query for server state; do not copy fetched results into Redux.
- Use Redux only for persisted client state: recent searches, cursor state, and view preference.
- Keep transient selection and iframe visibility page-local.
- Components receive typed data and callbacks; they do not issue HTTP requests.
- Preserve opaque cursor URLs; never derive pagination offsets.

## UI and Accessibility

- Prefer semantic HTML and native buttons for interactive controls.
- Keep the full flow keyboard accessible.
- Preserve focus management and reduced-motion behavior.
- Do not mount the embedded player until explicit artwork activation.

## Change Safety

- Do not add dependencies or change configuration without a clear need.
- Do not use `any`.
- Add or update focused tests for behavior changes.
- Do not stage, commit, push, or deploy unless explicitly requested.
