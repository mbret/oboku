import { DnsRounded } from "@mui/icons-material"
import { useUnsupportedRemoveResource } from "../../plugins/common/useUnsupportedRemoveResource"
import type { SourcePlugin } from "../../plugins/types"
import { TYPE } from "./constants"
import { LibrarySyncForm } from "./LibrarySyncForm"
import { DownloadBook } from "./DownloadBook"
import { UploadBook } from "./UploadBook"
import { useFilePathLinkInfo as useLinkInfo } from "../../plugins/common/linkInfo"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useLibrarySyncInfo } from "./useLibrarySyncInfo"
import { useSynchronize } from "./useSynchronize"

export const plugin: SourcePlugin<"server"> = {
  type: TYPE,
  name: "Server files",
  canRemoveResource: false,
  canSynchronize: true,
  Icon: DnsRounded,
  useLinkInfo,
  useLibrarySyncInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: () => () => {},
  UploadBookComponent: UploadBook,
  DownloadBookComponent: DownloadBook,
  LibrarySyncForm,
}
