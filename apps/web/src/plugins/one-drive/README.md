# Developer docs

- https://learn.microsoft.com/en-us/onedrive/developer/?view=odsp-graph-online
- https://github.com/OneDrive/samples/tree/master/samples/file-browsing

## Auth model

This plugin intentionally follows a single-account model.

- We do not rely on MSAL's `activeAccount` as application state.
- The source of truth is the cached account list returned by `getAllAccounts()`.
- When exactly one cached Microsoft account exists, we use it.
- When multiple cached accounts exist, we treat that as an unsupported ambiguous
  state and ask the user to clear the OneDrive session before continuing.

Rationale:

- `activeAccount` adds another mutable state that the app has to keep in sync.
- In this plugin, that extra state made the auth flow harder to reason about
  without giving us a real correctness guarantee.
- Since Oboku only intends to operate on one OneDrive account at a time, the
  simpler model is to support a single cached account and reject ambiguous
  cache state explicitly.

## Token validity

When we send a OneDrive token to the API, we require a minimum amount of time
left before expiration. The threshold is shared through the web
configuration (`MINIMUM_TOKEN_VALIDITY_MS`) so OneDrive and other providers can
use the same rule.
