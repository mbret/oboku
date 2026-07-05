import {
  type DefaultError,
  type QueryClient,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { Logger } from "../debug/logger.shared"
import { useHttpClientApi } from "../http"
import type { HttpApiClientWeb } from "../http/HttpClientApi.web"
import { getProfile } from "../profiles"
import type { Profile, ProfileWithLegacyTokens } from "../profiles/types"
import { useDeleteProfile } from "../profiles/useDeleteProfile"
import { isLoggedOutProfile } from "../profiles/useHasLoggedOutProfiles"
import { profilesQueryOptions } from "../profiles/useProfiles"

const getLegacyRefreshToken = (profile: Profile) => {
  const legacyProfile: ProfileWithLegacyTokens = profile

  return legacyProfile.refreshToken
}

const isRowStillATombstone = (queryClient: QueryClient, profileId: string) => {
  const currentRow = queryClient
    .getQueryData(profilesQueryOptions.queryKey)
    ?.find((candidate) => candidate.id === profileId)

  return !!currentRow && isLoggedOutProfile(currentRow)
}

/**
 * Best-effort revocation of `loggedOut` profile tombstones (see
 * `Profile.status`): each one's server session is revoked, then the local row
 * is deleted. A tombstone that fails (typically offline) is kept for a later
 * sweep. Sweeps run from a single place — `RevokeLoggedOutProfiles` fires one
 * whenever the app is online and a tombstone exists. Overlapping sweeps are
 * serialized through the mutation scope. A row overwritten by a re-login
 * while its logout call is in flight is left untouched.
 *
 * The refresh cookie is the revocation credential, and there is only one
 * cookie jar: once a newer sign-in replaced the cookies, an older tombstone's
 * chain can no longer be revoked from this client — its row is dropped and
 * the orphaned chain dies by the server-side TTL / stale-session cron.
 * Tombstones written before the cookie switch still carry their refresh
 * token and are revoked explicitly with it.
 */
const revokeCookieSessionTombstones = async ({
  httpClientApi,
  queryClient,
  tombstones,
  deleteProfile,
}: {
  httpClientApi: HttpApiClientWeb
  queryClient: QueryClient
  tombstones: Profile[]
  deleteProfile: (id: string) => Promise<unknown>
}) => {
  const aNewerSessionOwnsTheCookies = !!getProfile()

  if (!aNewerSessionOwnsTheCookies) {
    await httpClientApi.logout()
  }

  await Promise.all(
    tombstones.map(async function deleteRevokedTombstone(profile) {
      if (isRowStillATombstone(queryClient, profile.id)) {
        await deleteProfile(profile.id)
      }
    }),
  )
}

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
      const legacyTombstones = loggedOutProfiles.filter(getLegacyRefreshToken)
      const cookieSessionTombstones = loggedOutProfiles.filter(
        (profile) => !getLegacyRefreshToken(profile),
      )

      await Promise.all(
        legacyTombstones.map(async function revokeLegacyTombstone(profile) {
          try {
            await httpClientApi.logout({
              refresh_token: getLegacyRefreshToken(profile),
            })

            if (isRowStillATombstone(queryClient, profile.id)) {
              await deleteProfile(profile.id)
            }
          } catch (error) {
            Logger.error("Failed to revoke logged out profile", error)
          }
        }),
      )

      if (cookieSessionTombstones.length) {
        try {
          await revokeCookieSessionTombstones({
            httpClientApi,
            queryClient,
            tombstones: cookieSessionTombstones,
            deleteProfile,
          })
        } catch (error) {
          Logger.error("Failed to revoke logged out profiles", error)
        }
      }
    },
  })
}
