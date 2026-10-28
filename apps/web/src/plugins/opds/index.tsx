import { RssFeedRounded } from "@mui/icons-material"
import { PLUGIN_OPDS_TYPE } from "@oboku/shared"
import type { ObokuPlugin } from "../types"
import { useUnsupportedRemoveResource } from "../common/useUnsupportedRemoveResource"
import { DataSourceForm } from "./DataSourceForm"
import { DownloadBook } from "./DownloadBook"
import { InfoScreen } from "./InfoScreen"
import { useLinkInfo } from "./useLinkInfo"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { useSynchronize } from "./useSynchronize"

export const plugin: ObokuPlugin<"opds"> = {
  type: PLUGIN_OPDS_TYPE,
  name: "OPDS",
  canRemoveResource: false,
  canSynchronize: true,
  Icon: RssFeedRounded,
  description:
    "Sync the free books of an OPDS catalog, like Komga or Calibre-Web",
  DataSourceForm,
  InfoScreen,
  DownloadBookComponent: DownloadBook,
  useLinkInfo,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: function useOpdsSignOut() {
    return function signOutOfOpds() {}
  },
}
