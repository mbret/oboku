import { DnsRounded } from "@mui/icons-material"
import { useMutation } from "@tanstack/react-query"
import { UnsupportedMethodError } from "../../errors/errors.shared"
import type { ObokuPlugin } from "../types"
import { TYPE } from "./constants"
import { DownloadBook } from "./DownloadBook"
import { InfoScreen } from "./InfoScreen"
import { UploadBook } from "./UploadBook"
import { useLinkInfo } from "./useLinkInfo"
import { useRefreshMetadata } from "./useRefreshMetadata"

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

const useSyncSourceInfo: ObokuPlugin<"server">["useSyncSourceInfo"] = () => ({})

export const plugin: ObokuPlugin<"server"> = {
  type: TYPE,
  name: "Server",
  canRemoveBook: false,
  canSynchronize: false,
  Icon: DnsRounded,
  description: "Manage contents from your oboku server",
  useLinkInfo,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveBook,
  useSignOut: () => () => {},
  UploadBookComponent: UploadBook,
  DownloadBookComponent: DownloadBook,
  InfoScreen: () => <InfoScreen />,
}
