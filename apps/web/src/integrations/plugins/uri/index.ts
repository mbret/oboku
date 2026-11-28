import { HttpRounded } from "@mui/icons-material"
import { useUnsupportedRemoveResource } from "../common/useUnsupportedRemoveResource"
import { TYPE } from "./constants"
import type { SourcePlugin } from "../types"
import { SelectItem } from "./SelectItem"
import { UploadBookComponent } from "./UploadBookComponent"
import { DownloadBook } from "./DownloadBook"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import { useLinkInfo } from "./useLinkInfo"
import { useLibrarySyncInfo } from "./useLibrarySyncInfo"

const plugin: SourcePlugin<"URI"> = {
  type: TYPE,
  name: "Web address",
  canRemoveResource: false,
  canSynchronize: false,
  Icon: HttpRounded,
  UploadBookComponent,
  SelectItemComponent: SelectItem,
  DownloadBookComponent: DownloadBook,
  useLinkInfo,
  useLibrarySyncInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: () => () => {},
}

export default plugin
