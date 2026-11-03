import type { ObokuPlugin } from "../types"
import { createEmptyCredentialsRefreshMetadata } from "../common/createEmptyCredentialsRefreshMetadata"

export const useRefreshMetadata: ObokuPlugin<"URI">["useRefreshMetadata"] =
  createEmptyCredentialsRefreshMetadata<"URI">()
