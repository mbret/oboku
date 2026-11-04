import { Alert, Link } from "@mui/material"
import { getOpdsUrlOrigin, links } from "@oboku/shared"
import { memo, type ReactNode } from "react"
import { ConnectorForm as GenericConnectorForm } from "../../../../connectors/ConnectorForm"

const validateCatalogUrl = (url: string) =>
  getOpdsUrlOrigin(url.trim()) !== undefined ||
  "Enter the full address, starting with http:// or https://"

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
      validateUrl={validateCatalogUrl}
      topAlert={
        <Alert severity="info">
          OPDS connectors store the address of your catalog server, your
          username, and a reference to a secret containing your password. oboku
          sends your password to that address only, so that a link or a redirect
          in the catalog cannot pass it to another server. Books download from
          your browser, so your catalog has to allow it. Make sure to{" "}
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
