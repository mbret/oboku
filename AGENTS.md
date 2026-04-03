# AGENTS.md

## Engineering principles for Codex in this repository

When implementing changes in this codebase, prioritize consistency and consolidation over novelty.

### Reuse before creating

- Always look for existing components, hooks, utilities, routes, and data-access patterns before adding new ones.
- Extend or compose existing abstractions when possible instead of introducing parallel implementations.
- If a near match exists, adapt it to support the new use case rather than duplicating logic.

### TypeScript `as` usage

- Avoid using TypeScript's `as` type assertions unless absolutely necessary.
- Only use `as` when there is no safer or more idiomatic alternative (for example, when interfacing with third-party or legacy data you cannot control).
- When you need to use `as`, always add a code comment explaining why it is required in that context.
- Prefer type guards, runtime validation, and stricter data structures to ensure type safety and clarity instead of using type assertions.
- Rationale: Overuse of `as` can hide bugs, undermine type safety, and reduce code maintainability and refactorability.

### New feature implementation

- New features should follow established naming, folder structure, API shape, and UI conventions already used in neighboring code.
- Keep behavior and architecture aligned with existing patterns unless there is a clear technical reason not to.
- If divergence is necessary, keep it minimal and document the reason in the PR/commit notes.
- Prefer using existing mutation/query status and returned data to drive UI state before introducing extra local component state. When a hook already exposes the success, error, pending, or data needed for rendering or navigation, derive from that first.

### Refactoring and cleanup expectations

- During feature work, opportunistically consolidate duplicated code paths into existing shared patterns where safe.
- Prefer small, incremental refactors that reduce pattern drift without broad unrelated rewrites.
- Do not introduce new abstractions unless they are reused or clearly expected to be reused.

### Styling (MUI)

- Prefer dedicated MUI props for styling (e.g. `display`, `alignItems`, `padding`, `bgcolor`, `position`) over the `sx` prop whenever the same result can be achieved. Use `sx` only when you need theme functions, selectors, or values that have no dedicated prop.

### Shared package (@oboku/shared)

- No user-facing content strings (error messages, labels, placeholders, etc.) should live in the shared package.
- Keep content strings colocated in the consuming app (e.g. web) so they can be localized and adjusted per product without touching shared code.
- The shared package may define error codes, types, and structure; the app defines the human-readable messages.

### Package manager

- Use `npm` as the default package manager for this repository.
- Prefer `npm` commands over `pnpm` or `yarn` unless the user explicitly asks otherwise.
- When installing dependencies, running scripts, or reproducing CI/local workflows, follow the root `package-lock.json` as the source of truth.

### Synology API docs

- For Synology integrations, treat the public DSM Login Web API guide and File Station API guide as generic protocol references only.
- Do not assume the File Station docs define the contract for `SYNO.SynologyDrive.*` endpoints.
- The source of truth for Synology Drive API availability is the target NAS via `SYNO.API.Info`.
- When typing `SYNO.SynologyDrive.*` responses, prefer shapes validated against live NAS responses over guessed or loosely related public documentation.

### React `memo` components

- Always pass a named function to `memo()` instead of an anonymous arrow function (e.g. `memo(function MyComponent() { ... })` not `memo(() => { ... })`).
- This ensures memoized components are identifiable in React DevTools and error stack traces without needing a separate `displayName` assignment.

### React components: do not use `FC`

- Never use `React.FC`, `FC`, or `FunctionComponent` to type components. Treat that pattern as deprecated and do not add it in new code.
- Prefer explicit props types on the function instead, e.g. `function MyComponent(props: MyProps) { ... }` or `function MyComponent({ a, b }: MyProps) { ... }`, and rely on inferred return types (or annotate the return only when it genuinely helps).
- Rationale: `FC` is discouraged by current React and TypeScript practice (including implicit `children`, weaker inference, and unnecessary indirection).

### Decision rule

- Default choice: the solution that best matches current repository patterns and reduces long-term fragmentation.
