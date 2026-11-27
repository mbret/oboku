import { Alert, Link } from "@mui/material"
import { links } from "@oboku/shared"
import { memo, type ReactNode } from "react"
import { ConnectorForm as GenericConnectorForm } from "../../../../connectors/ConnectorForm"

export const ConnectorForm = memo(function ConnectorForm({
  onSubmitSuccess,
  children,
  connectorId,
}: {
  onSubmitSuccess: () => void
  children?: ReactNode
  connectorId?: string
}) {
  return (
    <GenericConnectorForm
      connectorId={connectorId}
      connectorType="opds"
      onSubmitSuccess={onSubmitSuccess}
      urlHelperText="Your password goes to this address only, never to another server the catalog links to. Enter the address your catalog uses itself, such as https:// if it redirects there."
      topAlert={
        <Alert severity="info">
          OPDS connectors store the address of your catalog server, your
          username, and a reference to a secret containing your password. Books
          download from your browser, so your catalog has to allow it. Make sure
          to{" "}
          <Link href={links.documentationOpds} target="_blank">
            read this
          </Link>{" "}
          before proceeding.
        </Alert>
      }
    >
      {children}
    </GenericConnectorForm>
  )
})
