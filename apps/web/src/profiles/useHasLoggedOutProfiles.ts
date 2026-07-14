import { useQuery } from "@tanstack/react-query"
import type { Profile } from "./types"
import { profilesQueryOptions } from "./useProfiles"

export const isLoggedOutProfile = (profile: Pick<Profile, "status">) =>
  profile.status === "loggedOut"

const hasLoggedOutProfiles = (profiles: Profile[]) =>
  profiles.some(isLoggedOutProfile)

export const useHasLoggedOutProfiles = () =>
  useQuery({ ...profilesQueryOptions, select: hasLoggedOutProfiles })
