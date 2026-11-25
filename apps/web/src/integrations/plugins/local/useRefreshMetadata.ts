import type { SourcePlugin } from "../types"
import { createEmptyCredentialsRefreshMetadata } from "../common/createEmptyCredentialsRefreshMetadata"

export const useRefreshMetadata: SourcePlugin<"file">["useRefreshMetadata"] =
  createEmptyCredentialsRefreshMetadata<"file">()
