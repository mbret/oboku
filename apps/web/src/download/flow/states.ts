import { signal } from "reactjrx"
import type { DownloadFlowRequest } from "./types"

export const downloadFlowRequestsSignal = signal<DownloadFlowRequest[]>({
  default: [],
})
