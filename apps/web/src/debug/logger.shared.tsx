import { isDebugEnabled } from "./isDebugEnabled.shared"
import { Report } from "@prose-reader/shared"
import { design } from "@oboku/shared"

export const Logger = Report.namespace("oboku", isDebugEnabled(), {
  color: design.palette.orangeLight,
})
