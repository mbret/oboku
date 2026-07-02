import { memo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useHttpClientApi } from "../../http"
import {
  archiveMutationKey,
  markAllSeenMutationKey,
  markSeenMutationKey,
} from "./queryKeys"
import { markSeenMutationOptions } from "./useMarkNotificationAsSeen"
import { markAllSeenMutationOptions } from "./useMarkAllNotificationsAsSeen"
import { archiveMutationOptions } from "./useArchiveNotification"

/**
 * Registers the inbox mutation defaults synchronously on first render (via the
 * `useState` initializer) so they exist before `resumePausedMutations` runs on
 * persist hydration—only mutations with registered defaults can be resumed.
 */
export const InboxMutationDefaults = memo(function InboxMutationDefaults() {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()

  useState(() => {
    queryClient.setMutationDefaults(
      markSeenMutationKey,
      markSeenMutationOptions(queryClient, httpClientApi),
    )
    queryClient.setMutationDefaults(
      markAllSeenMutationKey,
      markAllSeenMutationOptions(queryClient, httpClientApi),
    )
    queryClient.setMutationDefaults(
      archiveMutationKey,
      archiveMutationOptions(queryClient, httpClientApi),
    )
  })

  return null
})
