import { RssFeedRounded } from "@mui/icons-material"
import { PLUGIN_OPDS_TYPE } from "@oboku/shared"
import type { ObokuPlugin } from "../../plugins/types"
import { useUnsupportedRemoveResource } from "../../plugins/common/useUnsupportedRemoveResource"
import { DataSourceForm } from "./DataSourceForm"
import { DownloadBook } from "./DownloadBook"
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
  DataSourceForm,
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
