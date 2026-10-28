import type { ObokuPlugin } from "../types"
import { createEmptyCredentialsRefreshMetadata } from "../common/createEmptyCredentialsRefreshMetadata"

export const useRefreshMetadata: ObokuPlugin<"file">["useRefreshMetadata"] =
  createEmptyCredentialsRefreshMetadata<"file">()
