import { Alert, Link } from "@mui/material"
import { links } from "@oboku/shared"

export function WebdavRequirementsAlert() {
  return (
    <Alert severity="warning">
      Connecting to WebDAV server involves several requirements, make sure to{" "}
      <Link href={links.documentationConnectors} target="_blank">
        read this
      </Link>{" "}
      before proceeding.
    </Alert>
  )
}
