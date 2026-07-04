import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { Logger } from "../debug/logger.shared"
import { useHttpClientApi } from "../http"
import { useDeleteProfile } from "../profiles/useDeleteProfile"
import { isLoggedOutProfile } from "../profiles/useHasLoggedOutProfiles"
import { profilesQueryOptions } from "../profiles/useProfiles"

/**
 * Best-effort revocation of `loggedOut` profile tombstones (see
 * `Profile.status`): each one's server session is revoked, then the local row
 * is deleted. A profile that fails (typically offline) is kept for a later
 * sweep. Sweeps run from a single place — `RevokeLoggedOutProfiles` fires one
 * whenever the app is online and a tombstone exists. Overlapping sweeps are
 * serialized through the mutation scope. A row overwritten by a re-login while
 * its logout call is in flight is left untouched.
 */
export const useRevokeLoggedOutProfiles = (
  options?: Pick<UseMutationOptions<void, DefaultError, void>, "meta">,
) => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const { mutateAsync: deleteProfile } = useDeleteProfile({
    meta: { suppressGlobalErrorToast: true },
  })

  return useMutation({
    ...options,
    scope: { id: "revoke-logged-out-profiles" },
    mutationFn: async () => {
      const profiles = await queryClient.ensureQueryData(profilesQueryOptions)
      const loggedOutProfiles = profiles.filter(isLoggedOutProfile)

      await Promise.all(
        loggedOutProfiles.map(async function revokeAndDeleteProfile(profile) {
          try {
            await httpClientApi.logout({ refresh_token: profile.refreshToken })

            const currentRow = queryClient
              .getQueryData(profilesQueryOptions.queryKey)
              ?.find((candidate) => candidate.id === profile.id)
            const isRowStillThisTombstone =
              !!currentRow &&
              isLoggedOutProfile(currentRow) &&
              currentRow.refreshToken === profile.refreshToken

            if (isRowStillThisTombstone) {
              await deleteProfile(profile.id)
            }
          } catch (error) {
            Logger.error("Failed to revoke logged out profile", error)
          }
        }),
      )
    },
  })
}
