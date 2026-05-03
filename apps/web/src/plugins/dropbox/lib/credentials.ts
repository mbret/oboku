import type { DropboxAuth } from "dropbox"
import type { ProviderApiCredentials } from "@oboku/shared"

/**
 * Maps a freshly-authenticated Dropbox auth object to the provider credentials
 * shape consumed by the API and persisted on the data source.
 *
 * Used by both `useSynchronize` and `useRefreshMetadata` so the field set stays
 * in lockstep across mutations.
 */
export const mapDropboxAuthToProviderCredentials = (
  auth: DropboxAuth,
): ProviderApiCredentials<"dropbox"> => ({
  accessToken: auth.getAccessToken(),
  accessTokenExpiresAt: auth.getAccessTokenExpiresAt().toISOString(),
  clientId: auth.getClientId(),
  codeVerifier: auth.getCodeVerifier(),
  refreshToken: auth.getRefreshToken(),
})
