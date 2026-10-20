import { STORAGE_PREFIX_KEY } from "../../storage/constants"

// Named after its first use, sign-in. Renaming it would give every existing
// installation a new id.
const INSTALLATION_ID_STORAGE_KEY = `${STORAGE_PREFIX_KEY}:auth_installation_id`

/**
 * Returns a stable identifier for this browser installation/profile.
 *
 * Purpose:
 * - lets the API keep one refresh session per local installation
 * - avoids creating a new server-side session row on every sign-in
 * - survives sign-out because it identifies the installation, not the current auth session
 * - is the KOReader `device_id` the installation pushes reading positions as,
 *   so a pull tells its own pushes from other devices'
 *
 * Notes:
 * - this value is not a secret; the refresh token remains the secret
 * - clearing browser storage intentionally creates a new installation id
 * - the auth API receives this as `installation_id`
 */
export const getOrCreateInstallationId = () => {
  const existingInstallationId = localStorage.getItem(
    INSTALLATION_ID_STORAGE_KEY,
  )

  if (existingInstallationId) {
    return existingInstallationId
  }

  const installationId = crypto.randomUUID()

  localStorage.setItem(INSTALLATION_ID_STORAGE_KEY, installationId)

  return installationId
}

getOrCreateInstallationId()
