import {
  type DefaultError,
  type QueryClient,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { Logger } from "../debug/logger.shared"
import { useHttpClientApi } from "../http"
import { useDeleteProfile } from "../profiles/useDeleteProfile"
import { isLoggedOutProfile } from "../profiles/useHasLoggedOutProfiles"
import { profilesQueryOptions } from "../profiles/useProfiles"

const isRowStillATombstone = (
  queryClient: QueryClient,
  profileId: string,
  sessionId: string,
) => {
  const currentRow = queryClient
    .getQueryData(profilesQueryOptions.queryKey)
    ?.find((candidate) => candidate.id === profileId)

  return (
    !!currentRow &&
    isLoggedOutProfile(currentRow) &&
    currentRow.sessionId === sessionId
  )
}

/**
 * Best-effort revocation of `loggedOut` profile tombstones (see
 * `Profile.status`). Each tombstone carries its own `sessionId`, so revocation
 * is session-scoped and race-free: the sweep revokes exactly that session
 * whatever refresh cookie is in the jar, then deletes the local row only while
 * it still carries the revoked `sessionId`. A same-account re-login mints a new
 * session id, so revoking an old tombstone can never touch it. A tombstone that
 * fails to revoke (typically offline) is kept for a later sweep; the others
 * still proceed.
 *
 * Sweeps run from a single place — `RevokeLoggedOutProfiles` fires one whenever
 * the app is online and a tombstone exists. Overlapping sweeps are serialized
 * through the mutation scope. A row a re-login turned back into an active
 * profile — or into a fresher tombstone under a new session id — while its
 * logout call was in flight is left for that new session's own sweep.
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
      const tombstones = profiles.filter(isLoggedOutProfile)

      if (!tombstones.length) return

      await Promise.all(
        tombstones.map(async function revokeTombstone(profile) {
          try {
            await httpClientApi.logout(profile.sessionId)

            if (
              isRowStillATombstone(queryClient, profile.id, profile.sessionId)
            ) {
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
