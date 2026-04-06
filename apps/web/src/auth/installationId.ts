const AUTH_INSTALLATION_ID_STORAGE_KEY = "auth_installation_id"

/**
 * Returns a stable identifier for this browser installation/profile.
 *
 * Purpose:
 * - lets the API keep one refresh session per local installation
 * - avoids creating a new server-side session row on every sign-in
 * - survives sign-out because it identifies the installation, not the current auth session
 *
 * Notes:
 * - this value is not a secret; the refresh token remains the secret
 * - clearing browser storage intentionally creates a new installation id
 * - the auth API receives this as `installation_id`
 */
export const getOrCreateAuthInstallationId = () => {
  const existingInstallationId = localStorage.getItem(
    AUTH_INSTALLATION_ID_STORAGE_KEY,
  )

  if (existingInstallationId) {
    return existingInstallationId
  }

  const installationId = crypto.randomUUID()

  localStorage.setItem(AUTH_INSTALLATION_ID_STORAGE_KEY, installationId)

  return installationId
}
