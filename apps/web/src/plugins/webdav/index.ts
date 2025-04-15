import { StorageRounded } from "@mui/icons-material"
import type { ObokuPlugin } from "../types"
import { TYPE, UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { AddDataSource } from "./AddDataSource"
import { useSynchronize } from "./useSynchronize"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { InfoScreen } from "./InfoScreen"

const plugin: ObokuPlugin<"webdav"> = {
  type: TYPE,
  name: "WebDAV",
  canSynchronize: true,
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  Icon: StorageRounded,
  description: "Manage contents from WebDAV",
  AddDataSource,
  useSynchronize,
  useSyncSourceInfo,
  InfoScreen,
}

export default plugin
