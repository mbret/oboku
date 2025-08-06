import { isDebugEnabled } from "./isDebugEnabled.shared"
import { Report } from "@prose-reader/shared"

export const Logger = Report.namespace("oboku", isDebugEnabled(), {
  color: "#e16432",
})
