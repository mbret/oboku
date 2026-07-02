# Plan: migrate auth from a reactjrx signal to react-query backed by a Dexie `profiles` table

## Goal

Move client-side **authentication state** out of the reactjrx `authStateSignal`
(persisted to `localStorage`) and into **react-query**, sourced from a new
**`profiles` table in the `oboku-dexie` IndexedDB database**. The table is keyed
per account (`nameHex`) so it is **multi-account-ready**, even though the app
keeps a single active account for now.

The guiding principle: **auth is react-query data accessed only through React.**
There is no global `queryClient` singleton. The imperative code paths that today
reach the auth signal from outside React (HTTP interceptors, the service-worker
bridge, a debug subscriber) are **inverted**: they are *installed from within
React* by a provider that closes over `useQueryClient()`, and torn down on
cleanup.

## In scope

- New `profiles` Dexie table (v5), row shape `{ id: nameHex, auth: AuthSession }`.
- Auth read/write via react-query instead of `authStateSignal`.
- React-scoped installation of the HTTP request/response interceptors and the
  service-worker auth bridge.
- One-time migration of the existing `localStorage` auth into a `profiles` row so
  users are **not** logged out on deploy.

## Explicitly OUT of scope (deferred, do NOT touch)

- The **profile preferences bucket** ("profile-x") — the 6 UI-state signals
  persisted under `localStorage` key `profile-<nameHex>` via `useProfileStorage`
  / `signalEntriesToPersist` (`libraryStateSignal`, `libraryShelvesFiltersSignal`,
  `localSettingsSignal`, `bookBeingReadStateSignal`,
  `collectionDetailsScreenListControlsStateSignal`,
  `searchListActionsToolbarSignal`). Leave these on their current localStorage
  path. They can move into a `prefs` field on the `profiles` row in a later pass.
- The service-worker HTTP client itself (`http/httpClientApi.sw.ts`) — it already
  delegates auth to the page and needs **no changes**.
- Coexisting per-account RxDB databases / an account-switcher UI. Keep today's
  single-active behaviour (switching accounts recreates the RxDB db in
  `completeAuthentication`).

---

## Current architecture (facts the implementing agent needs)

### The auth signal
- `apps/web/src/auth/states.web.ts` defines `authStateSignal =
  signal<AuthSession | null | undefined>(...)`, plus `usePersistAuthState()`
  which persists it via reactjrx `createLocalStorageAdapter({ key: "auth" })`.
- `apps/web/src/auth/types.ts`: `AuthSession = { accessToken, refreshToken,
  email, nameHex, dbName, needsRelogin? }`.
- Persistence format: the localStorage entry `auth` holds a shared-store JSON
  envelope `{ authState: { value: <AuthSession>, __persistanceIdentifier__,
  migrationVersion } }` (plain `JSON.stringify`). The migration in Phase 6 must
  read this exact shape.

### Where auth is READ/WRITTEN today (`grep authStateSignal`)
React consumers (read via `useSignalValue` — mechanical port to a query hook):
- `auth/useIsAuthenticated.ts`, `auth/useHasAuthentication.ts`
- `auth/NotifyExpiredSession.tsx`, `auth/DeleteAccountDialog.tsx`
- `pages/profile/ProfileScreen.tsx`, `pages/ReloginScreen.tsx`
- `notifications/inbox/useLocalNotifications.ts`
- `rxdb/replication/useBackgroundReplication.ts` (reads `dbName`)

Writers (React-scoped):
- `auth/completeAuthentication.ts` — `authStateSignal.update(auth)` on
  login/switch; also `setProfile(nameHex)` + `currentProfileSignal.update(...)`;
  recreates the RxDB db when the account changed.
- `auth/useSignOut.ts` — `authStateSignal.update(SIGNAL_RESET)` + `removeProfile()`
  + query/mutation cache reset + `persister.removeClient()`.

Imperative edges (the only truly non-React auth accessors — all run on the page):
- `http/injectToken.web.ts` — `async` request interceptor reading
  `authStateSignal.getValue()?.accessToken`.
- `http/httpClientApi.web.ts` — registers the interceptors at module scope
  (bottom of file: `httpClientApi.useRequestInterceptor(injectToken)` and
  `httpClientApi.useResponseInterceptor(refreshOnUnauthorized)`). Contains
  `refreshAuthState` / `refreshAuthSession` (reads/writes the signal, with an
  in-flight dedup via module var `refreshSessionPromise`), `flagSessionForRelogin`
  (sets `needsRelogin`), and a retry path that calls `injectToken(...)` directly.
- `workers/communication/communication.web.ts` (~lines 74, 79–92) — answers the
  service worker's auth asks with `authStateSignal.value` and calls
  `refreshAuthSession(refreshToken)`.
- `debug/tracking.ts` — `authStateSignal.subscribe(...)`.

Non-React but already decoupled (no change):
- `http/httpClientApi.sw.ts` — the SW client asks the page via
  `serviceWorkerCommunication.askClientAuth(clientId)` / `refreshClientAuth`.

### queryClient
- `queries/QueryClientProvider.tsx` creates the client with
  `useState(createQueryClient)` — **not** a module singleton. Keep it that way.
  All new code reaches it via `useQueryClient()`.
- The query-cache **persister** (`queries/persister.ts`, wired in
  `QueryClientProvider.tsx`) only dehydrates queries whose first key segment is
  `API_QUERY_KEY_PREFIX` (`"api"`, from `queries/queryClient.ts`). Therefore the
  new auth/profile query key MUST NOT start with `"api"`, so the profiles table
  remains its sole persistence.

### Dexie db
- `apps/web/src/rxdb/dexie.ts` — `dexieDb = new Dexie("oboku-dexie")`, currently
  at `version(4)` with stores `downloads` and `queryCachePersistence`. Each new
  version must re-list every kept store.

### App boot / gating (`apps/web/src/App.tsx`)
- `usePersistAuthState()` → `isAuthHydrated`.
- `useProfileStorage()` + `usePersistSignals(...)` → `isProfileHydrated` (this is
  the profile-x path — leave it).
- Render gate: `!isHydratingProfile && isAuthHydrated`.
  `isAppReady = isDownloadsHydrated && isAuthHydrated && !isPreloadingQueries`.
- Provider nesting: `QueryClientProvider` > `QueryClientProvider$` (reactjrx) >
  `LoadConfiguration` > `App`.

### Active-profile pointer (`apps/web/src/profiles/currentProfile.ts`)
- `localStorage` key `configuration.STORAGE_PROFILE_KEY` (value `"profile"`) holds
  the active `nameHex` as a raw string. `getProfile()/setProfile()/removeProfile()`
  + `currentProfileSignal`. `currentProfileSignal` is consumed by
  `useProfileStorage` (profile-x) — so it must keep working (see Transition
  coupling below).

---

## Target architecture

- **`profiles` Dexie table**, key `id` = `nameHex`, row `{ id, auth: AuthSession }`.
- **Active-profile pointer** stays in `localStorage` (key `"profile"`), also
  exposed as a query `["activeProfileId"]` seeded synchronously via `initialData`
  so bootstrap stays sync.
- **Auth query** at key `["profile", activeProfileId]` (NOT `api`-prefixed),
  `queryFn` reads the Dexie row, `staleTime: Infinity`, `enabled: !!activeId`.
- **Writes** go through Dexie (`dexieDb.profiles.put/...`) plus
  `queryClient.setQueryData(["profile", id], row)`.
- **Imperative edges installed from React** by a provider closing over
  `useQueryClient()`, using the disposers returned by
  `httpClient.useRequestInterceptor`/`useResponseInterceptor` for cleanup.

### Key invariant (do not violate)
No authed HTTP request may fire before the interceptors are installed. Because
installation moves from module scope into a React effect, the app must **gate any
UI that issues authed requests behind "interceptors installed AND auth hydrated"**
(fold into the existing `isAuthHydrated` gate in `App.tsx`).

---

## Ordered phases

### Phase 0 — Dexie schema
`rxdb/dexie.ts`:
- Add `interface Profile { id: string; auth: AuthSession }` (import `AuthSession`
  from `../auth/types`).
- Extend the cast type with `profiles: EntityTable<Profile, "id">`.
- Add `dexieDb.version(5).stores({ downloads: "++id, data, filename",
  queryCachePersistence: "&key", profiles: "&id" })` — re-listing existing stores.
  No `.upgrade()` (new empty table).

### Phase 1 — profiles data layer + auth query
New module(s) under `apps/web/src/profiles/` (colocate with existing files):
- Dexie wrappers: `getProfileRow(id)`, `putProfileRow(row)`,
  `updateProfileAuth(id, partialAuth)`, `deleteProfileRow(id)`, `listProfiles()`.
- Active-profile pointer as query `["activeProfileId"]`:
  - `useActiveProfileId()` — `useQuery` with `initialData: getProfile()`,
    `queryFn` returning the localStorage value, `staleTime: Infinity`.
  - `setActiveProfileId(queryClient, nameHex)` — writes localStorage (reuse
    `setProfile`) + `setQueryData(["activeProfileId"], nameHex)`.
  - `clearActiveProfileId(queryClient)` — `removeProfile()` +
    `setQueryData(["activeProfileId"], undefined)`.
- Auth query + selectors:
  - `useAuthSession()` — `useQuery({ queryKey: ["profile", activeId],
    queryFn: () => getProfileRow(activeId).then(r => r?.auth ?? null),
    enabled: !!activeId, staleTime: Infinity })`.
  - `useIsAuthenticated()` / `useHasAuthentication()` reimplemented on top of it
    (preserve current semantics: authenticated = session present AND
    `!needsRelogin`; has-auth = session present).
  - `getAuthSession(queryClient, activeId)` — sync helper returning
    `queryClient.getQueryData(["profile", activeId])`-derived auth, for the
    interceptor closures.

### Phase 2 — React-scoped interceptor installer (the inversion)
New `http/InstallApiInterceptors.tsx` (mounted high in the tree, see Phase 5):
- Closes over `useQueryClient()` and the active profile id.
- In an effect, builds and registers:
  1. request interceptor — injects `Bearer ${getAuthSession(...)?.accessToken}`
     (port `injectToken.web.ts` logic into a closure factory).
  2. response interceptor `refreshOnUnauthorized` — on 401 reads the refresh
     token from the query, calls `httpClientApi.refreshToken({ refreshToken,
     useInterceptors: false })`, on success writes new tokens via `putProfileRow`
     + `setQueryData`, on 401/403 sets `needsRelogin`; retries the original
     request once with the refreshed token (skipping interceptors), matching
     current behaviour.
  3. the `communication.web.ts` auth handler — answers the SW using the same
     shared `refreshAuthSession` closure so web + SW share one in-flight-refresh
     dedup.
- Keeps the in-flight dedup (`refreshSessionPromise`) inside the closure/module.
- Returns all disposers from the effect for cleanup.

Refactor `http/httpClientApi.web.ts`:
- Remove the module-scope `useRequestInterceptor`/`useResponseInterceptor` calls
  and the `authStateSignal` import.
- Keep the `HttpApiClient` class and its `refreshToken` method; export whatever
  the installer needs (or move the refresh helpers into the installer module).

`http/injectToken.web.ts`: convert into a factory
`createInjectToken(getAccessToken)` (or fold into the installer). No global signal
read.

`workers/communication/communication.web.ts`: stop reading `authStateSignal`;
have its auth handler call into the installer-provided closures (e.g. registered
via a small React-scoped registration, consistent with the interceptor install).

### Phase 3 — writers
- `auth/completeAuthentication.ts`: replace `authStateSignal.update(auth)` with
  `putProfileRow({ id: auth.nameHex, auth })` + `setActiveProfileId(queryClient,
  auth.nameHex)` + `setQueryData(["profile", auth.nameHex], auth)`. Keep the
  `switchedAccount`/`reCreateDb`/`resetQueries`/`persister.removeClient` logic.
  **Transition coupling:** also keep `setProfile(nameHex)` +
  `currentProfileSignal.update(nameHex)` so profile-x keeps working
  (`setActiveProfileId` can simply call `setProfile` + update the signal + set the
  query data).
- `auth/useSignOut.ts`: replace the signal reset with
  `clearActiveProfileId(queryClient)` + `deleteProfileRow(id)` + remove the
  `["profile", id]` query data; keep `removeProfile()` (still needed for
  profile-x), the query/mutation cache reset, and `persister.removeClient()`.

### Phase 4 — readers
Port every `useSignalValue(authStateSignal)` site to the new hooks:
`useIsAuthenticated`, `useHasAuthentication`, `NotifyExpiredSession`,
`DeleteAccountDialog`, `ProfileScreen`, `ReloginScreen`, `useLocalNotifications`,
`useBackgroundReplication` (reads `dbName` from the session).
`debug/tracking.ts`: replace `authStateSignal.subscribe` with a
`queryClient.getQueryCache().subscribe(...)` (or an effect watching the auth
query) installed in the same provider as Phase 2.

### Phase 5 — boot + gating (`apps/web/src/App.tsx`)
- Replace `usePersistAuthState()` with the auth-query hydration; derive
  `isAuthHydrated` from the query having settled for the active id (or `true`
  when there is no active id).
- Mount `InstallApiInterceptors` above anything that issues authed requests
  (`WithAuthentication`, `BackgroundReplication`, `PreloadQueries`) and block those
  children until **interceptors installed AND auth hydrated**.
- Leave the profile-x hydration (`useProfileStorage` + `usePersistSignals` →
  `isProfileHydrated`) untouched.

### Phase 6 — one-time migration
Run once on boot, before the auth query resolves, guarded by "profiles table
empty AND legacy `localStorage.auth` present":
- Parse the legacy envelope from key `auth`
  (`JSON.parse(...).authState.value` → `AuthSession`).
- If valid, `putProfileRow({ id: auth.nameHex, auth })`, ensure the
  `"profile"` pointer is set to `nameHex`, then remove the legacy `auth` key.
- Idempotent (skip if the row already exists). Do NOT touch `profile-<nameHex>`
  (profile-x stays).

### Phase 7 — tests + teardown
- Rewrite `http/httpClientApi.web.test.ts` (currently drives `authStateSignal`)
  against the query-based flow (seed via `setQueryData` / `putProfileRow`).
- Once unused, delete `authStateSignal` + `usePersistAuthState` from
  `auth/states.web.ts`.
- `currentProfileSignal` stays for now (profile-x depends on it).
- Run: typecheck, `biome` lint, and the web test suite. Manually verify: cold
  boot while logged in (migration), login, 401 → refresh → retry, sign-out, and a
  service-worker-mediated request still gets a token.

---

## Risks / watch-list
1. **Ordering (highest):** no authed request may fire before Phase 2 interceptors
   are installed — enforce via the Phase 5 gate.
2. **Migration envelope shape:** the legacy value is a reactjrx shared-store
   envelope, not a bare `AuthSession`.
3. **Shared refresh dedup:** the web response interceptor and the SW bridge must
   share one in-flight `refreshSessionPromise`.
4. **Transition coupling:** `currentProfileSignal` / `setProfile` / `removeProfile`
   must keep tracking the active `nameHex` so the untouched profile-x path keeps
   working.
5. **Query key prefix:** `["profile", id]` must not start with `"api"` or the
   query-cache persister will duplicate its persistence.

## Conventions (from AGENTS.md)
- No `React.FC`; name every function/callback (incl. `memo(function X(){})` and
  effect/cleanup callbacks); prefer `styled(Component)` over `sx`; avoid `as`
  (comment when unavoidable); reuse existing patterns; `npm` as package manager.
