import type { SourcePlugin } from "../../plugins/types"
import { useUnsupportedRemoveResource } from "../../plugins/common/useUnsupportedRemoveResource"
import { TYPE } from "./constants"
import { LibrarySyncForm } from "./LibrarySyncForm"
import { useSynchronize } from "./useSynchronize"
import { useLibrarySyncInfo } from "./useLibrarySyncInfo"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { DownloadBook } from "./DownloadBook"
import { UploadBook } from "./UploadBook"
import { useFilePathLinkInfo as useLinkInfo } from "../../plugins/common/linkInfo"
import { SvgIcon } from "@mui/material"
import WebDAVIconAsset from "../../../assets/webdav-icon.svg?react"

const WebDAVIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <WebDAVIconAsset />
  </SvgIcon>
)

const plugin: SourcePlugin<"webdav"> = {
  type: TYPE,
  name: "WebDAV",
  canRemoveResource: false,
  canSynchronize: true,
  Icon: WebDAVIcon,
  LibrarySyncForm,
  UploadBookComponent: UploadBook,
  useSynchronize,
  useLibrarySyncInfo,
  useLinkInfo,
  useRefreshMetadata,
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: () => () => {},
  DownloadBookComponent: DownloadBook,
}

export default plugin
