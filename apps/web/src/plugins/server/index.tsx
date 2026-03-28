import { DnsRounded } from "@mui/icons-material"
import { useMutation } from "@tanstack/react-query"
import { memo, useEffect } from "react"
import { UnsupportedMethodError } from "../../errors/errors.shared"
import type { ObokuPlugin } from "../types"
import { TYPE, UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { InfoScreen } from "./InfoScreen"

const useSynchronize: ObokuPlugin<"server">["useSynchronize"] = () => {
  return useMutation({
    mutationFn: async () => {
      throw new UnsupportedMethodError("Not yet implemented")
    },
  })
}

const useRemoveBook: ObokuPlugin<"server">["useRemoveBook"] = () => {
  return async () => {
    throw new UnsupportedMethodError("Not yet implemented")
  }
}

const useRefreshMetadata: ObokuPlugin<"server">["useRefreshMetadata"] = () => {
  return useMutation({
    mutationFn: async () => {
      throw new UnsupportedMethodError("Not yet implemented")
    },
  })
}

const useLinkInfo: ObokuPlugin<"server">["useLinkInfo"] = () => ({
  data: undefined,
})

const useSyncSourceInfo: ObokuPlugin<"server">["useSyncSourceInfo"] = () => ({})

const DownloadBook: ObokuPlugin<"server">["DownloadBookComponent"] = memo(
  ({ onError }) => {
    useEffect(() => {
      onError(new UnsupportedMethodError("Not yet implemented"))
    }, [onError])

    return null
  },
)

export const plugin: ObokuPlugin<"server"> = {
  type: TYPE,
  name: "Server",
  canRemoveBook: false,
  canSynchronize: false,
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  Icon: DnsRounded,
  description: "Manage contents from your oboku server",
  useLinkInfo,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveBook,
  useSignOut: () => () => {},
  DownloadBookComponent: DownloadBook,
  InfoScreen: () => <InfoScreen />,
}
