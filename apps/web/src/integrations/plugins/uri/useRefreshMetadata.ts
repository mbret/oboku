import type { SourcePlugin } from "../types"
import { createEmptyCredentialsRefreshMetadata } from "../common/createEmptyCredentialsRefreshMetadata"

export const useRefreshMetadata: SourcePlugin<"URI">["useRefreshMetadata"] =
  createEmptyCredentialsRefreshMetadata<"URI">()
