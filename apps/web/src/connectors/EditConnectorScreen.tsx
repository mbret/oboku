import { Button } from "@mui/material"
import { memo, type ReactNode } from "react"
import { useParams } from "react-router"
import { useConfirmation } from "../common/useConfirmation"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { useNotifications } from "../notifications/useNofitications"
import type { SettingsConnectorType } from "@oboku/shared"
import { CONNECTOR_DETAILS } from "./connectorDetails"
import { useDeleteConnector } from "./useDeleteConnector"

export const EditConnectorScreen = memo(
  ({
    connectorType,
    children,
  }: {
    connectorType: SettingsConnectorType
    children: (props: {
      connectorId: string
      onSubmitSuccess: () => void
      deleteButton: ReactNode
    }) => ReactNode
  }) => {
    const { goBack } = useSafeGoBack()
    const { mutate: deleteConnector } = useDeleteConnector()
    const { notify } = useNotifications()
    const confirmation = useConfirmation()
    const { id = "-1" } = useParams()
    const { label, manageRoute } = CONNECTOR_DETAILS[connectorType]

    const deleteButton = (
      <Button
        color="error"
        onClick={() => {
          const confirm = confirmation()

          if (confirm) {
            deleteConnector(
              { id },
              {
                onSuccess: () => {
                  notify("actionSuccess")
                  goBack(manageRoute)
                },
              },
            )
          }
        }}
        variant="contained"
      >
        Delete
      </Button>
    )

    return (
      <>
        <TopBarNavigation title={`${label}: Edit connector`} />
        {children({
          connectorId: id,
          onSubmitSuccess: () => goBack(manageRoute),
          deleteButton,
        })}
      </>
    )
  },
)
