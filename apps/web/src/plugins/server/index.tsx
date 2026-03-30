import { DnsRounded } from "@mui/icons-material"
import { UnsupportedMethodError } from "../../errors/errors.shared"
import type { ObokuPlugin } from "../types"
import { TYPE } from "./constants"
import { DataSourceForm } from "./DataSourceForm"
import { DownloadBook } from "./DownloadBook"
import { InfoScreen } from "./InfoScreen"
import { UploadBook } from "./UploadBook"
import { useLinkInfo } from "./useLinkInfo"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { useSynchronize } from "./useSynchronize"

const useRemoveBook: ObokuPlugin<"server">["useRemoveBook"] = () => {
  return async () => {
    throw new UnsupportedMethodError("Not yet implemented")
  }
}

export const plugin: ObokuPlugin<"server"> = {
  type: TYPE,
  name: "Server",
  canRemoveBook: false,
  canSynchronize: true,
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
  DataSourceCreateForm: (props) => (
    <DataSourceForm {...props} submitLabel="Confirm" />
  ),
  // The screen matches plugins by dataSource.type, guaranteeing the correct variant.
  DataSourceEditForm: ({ dataSource, ...rest }) => (
    <DataSourceForm
      {...rest}
      dataSource={dataSource as never}
      submitLabel="Save"
    />
  ),
  InfoScreen: () => <InfoScreen />,
}
