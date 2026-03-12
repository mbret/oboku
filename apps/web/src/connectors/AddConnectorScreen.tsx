import { memo, type ReactNode } from "react"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import type { SettingsConnectorType } from "@oboku/shared"
import { CONNECTOR_DETAILS } from "./connectorDetails"

export const AddConnectorScreen = memo(
  ({
    connectorType,
    children,
  }: {
    connectorType: SettingsConnectorType
    children: (props: { onSubmitSuccess: () => void }) => ReactNode
  }) => {
    const { goBack } = useSafeGoBack()
    const { label, manageRoute } = CONNECTOR_DETAILS[connectorType]

    return (
      <>
        <TopBarNavigation title={`${label}: New connector`} />
        {children({
          onSubmitSuccess: () => goBack(manageRoute),
        })}
      </>
    )
  },
)
