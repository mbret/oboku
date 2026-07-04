import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
} from "@tanstack/react-query"
import { Logger } from "../debug/logger.shared"
import { useHttpClientApi } from "../http"
import { useDeleteProfile } from "../profiles/useDeleteProfile"
import type { Profile } from "../profiles/types"
import { dexieDb } from "../rxdb/dexie"

const isLoggedOutProfile = (profile: Profile) => profile.status === "loggedOut"

/**
 * Best-effort revocation of `loggedOut` profile tombstones (see
 * `Profile.status`): each one's server session is revoked, then the local row
 * is deleted. A profile that fails (typically offline) is kept for a later
 * sweep — triggered on boot, on regaining network, and after explicit
 * sign-out. Overlapping sweeps are serialized through the mutation scope.
 */
export const useRevokeLoggedOutProfiles = (
  options?: Pick<UseMutationOptions<void, DefaultError, void>, "meta">,
) => {
  const httpClientApi = useHttpClientApi()
  const { mutateAsync: deleteProfile } = useDeleteProfile({
    meta: { suppressGlobalErrorToast: true },
  })

  return useMutation({
    ...options,
    scope: { id: "revoke-logged-out-profiles" },
    mutationFn: async () => {
      const loggedOutProfiles = await dexieDb.profiles
        .filter(isLoggedOutProfile)
        .toArray()

      await Promise.all(
        loggedOutProfiles.map(async function revokeAndDeleteProfile(profile) {
          try {
            await httpClientApi.logout({ refresh_token: profile.refreshToken })
            await deleteProfile(profile.id)
          } catch (error) {
            Logger.error("Failed to revoke logged out profile", error)
          }
        }),
      )
    },
  })
}
