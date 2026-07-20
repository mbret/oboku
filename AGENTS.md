# AGENTS.md

## Engineering principles in this repository

- When implementing changes in this codebase, prioritize consistency and consolidation over novelty.

### Code comments

- **Default to no comments.** Code, names, and types are the documentation. Add a comment only when a future reader cannot recover the intent from the code itself.
- **Never restate what the code does.** If the comment paraphrases the next line, delete it.
- **Never explain a change you are making.** Comments are about the resulting code, not about the diff or the review that produced it.
- **Never narrate trivial mechanics** ("seed the form", "fall back to default", "guard for unmount", "cleanup on success", "preserves siblings", etc.). If the function/variable name doesn't already say that, rename instead of commenting.
- **No "why" boilerplate.** Don't write comments like "we do X so that Y" unless Y is genuinely surprising and not visible from reading the function. A two-word identifier (`safeFallback`, `corsHeaders`, …) usually beats a three-line comment.
- **Allowed comments** (rare, deliberate):
    - Workarounds for third-party bugs, with a link or version reference.
    - Non-obvious invariants or ordering constraints that aren't enforced by the type system.
    - Explanations *required* by another rule in this file (e.g. the `as` rule, the MUI polymorphic-strip cast rule).
    - Spec citations when the code implements a non-trivial part of an external spec.
- **JSDoc on exported APIs is fine** when it documents the *contract* (parameters, return shape, edge cases) — not when it restates the implementation.
- **Delete stale comments aggressively.** A comment that lies is worse than no comment.

### Self-explanatory code over comments

- **Make naming carry the intent a comment would have carried.** Before writing a comment, try to encode the same information in a name. Prefer renaming over annotating.
- **Name boolean conditions and predicates.** Extract non-trivial conditions into named variables or small predicates (`isWakeLockSupported()`, `isDocumentVisible()`, `wasUnmountedWhileRequesting`) instead of leaving bare expressions with an explanatory comment.
- **Name every function expression, including callbacks.** Pass named functions to `useEffect`, its cleanup return, event handlers, timers, and promise callbacks (e.g. `useEffect(function keepScreenAwakeWhileMounted() { ... }, [])`, `return function releaseWakeLockOnUnmount() { ... }`, `onWakeLockReleasedByOs`). Named functions document purpose at the call site and show up by name in stack traces and DevTools.
- **Name intermediate values** rather than commenting what a literal or expression means. A descriptive `const` is preferable to an inline value plus a comment.
- **The goal:** a reader should understand *what* and *why* from identifiers and structure alone. Comments remain reserved for the rare cases listed under "Code comments" above (third-party workarounds, non-obvious invariants, spec citations).

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

### React-query mutations: global error toast (web)

- The web app's global `MutationCache.onError` (see `QueryClientProvider.tsx`) shows an error toast for every mutation failure unless the mutation sets `meta.suppressGlobalErrorToast`.
- `suppressGlobalErrorToast` is always the **consumer's** decision: only the call site knows whether the mutation is a standalone user-facing action (toast wanted) or is nested inside another mutation / background flow that owns its error handling (toast unwanted).
- Never hard-code `meta: { suppressGlobalErrorToast: true }` inside a reusable mutation hook. Instead, have the hook accept `options?: Pick<UseMutationOptions<...>, "meta">` and spread it into `useMutation` (see `useSignIn`, `useDeleteProfile`), letting each call site opt out of the toast.

### React `memo` components

- Always pass a named function to `memo()` instead of an anonymous arrow function (e.g. `memo(function MyComponent() { ... })` not `memo(() => { ... })`).
- This ensures memoized components are identifiable in React DevTools and error stack traces without needing a separate `displayName` assignment.

### MUI: prefer `styled` over `sx` and keep the underlying component name

- For non-trivial styling, prefer extracting a named `styled(Component)` declaration over inlining `sx={{ ... }}` in JSX. Reserve `sx` for one-off, dynamic, or prop-driven styles where extracting would obscure intent.
- Always include the underlying component's name as a suffix in the styled component's name so the underlying element is obvious at a glance: e.g. `styled(DialogContent)` → `HeaderDialogContent` (not `HeaderContent`), `styled(Stack)` → `ActionsStack` (not `ActionsRow`), `styled(Typography)` → `WarningTypography`.
- Place styled declarations near the top of the file (after imports) so they're easy to scan.
- When `styled(Component)` strips a polymorphic prop (most commonly `Typography`'s `component`), cast the result back to `typeof Component` and add a one-line comment explaining the cast — see the `as` rule above.
- Rationale: named styled components show up as themselves in React DevTools, eliminate repeated inline blocks, and let readers understand the rendered DOM without crawling through `sx` props.

### React components: do not use `FC`

- Never use `React.FC`, `FC`, or `FunctionComponent` to type components. Treat that pattern as deprecated and do not add it in new code.
- Prefer explicit props types on the function instead, e.g. `function MyComponent(props: MyProps) { ... }` or `function MyComponent({ a, b }: MyProps) { ... }`, and rely on inferred return types (or annotate the return only when it genuinely helps).
- Rationale: `FC` is discouraged by current React and TypeScript practice (including implicit `children`, weaker inference, and unnecessary indirection).

### Decision rule

- Default choice: the solution that best matches current repository patterns and reduces long-term fragmentation.
