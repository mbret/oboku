import { ComponentProps } from "react"
import { DrivePicker } from "./DrivePicker"
import { BlockingScreen } from "../../common/BlockingBackdrop"
import { useDataSourceHelpers } from "../helpers"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { ObokuPlugin } from "@oboku/plugin-front"

export const SelectItem: ObokuPlugin[`SelectItemComponent`] = ({
  onClose,
  open
}) => {
  const { generateResourceId } = useDataSourceHelpers(
    UNIQUE_RESOURCE_IDENTIFIER
  )

  const onPick: ComponentProps<typeof DrivePicker>["onClose"] = async (
    data
  ) => {
    if (data instanceof Error) {
      onClose({ code: `unknown`, originalError: data })
    } else if (data.action === `cancel`) {
      onClose()
      // type is broken and does not have loaded https://developers.google.com/picker/docs/reference#action
      // @ts-ignore
    } else if (data.action !== "loaded") {
      if (data.action === "picked") {
        const [doc] = data?.docs || []

        if (!doc) {
          onClose({
            code: `unknown`
          })
        } else {
          onClose(undefined, {
            resourceId: generateResourceId(doc.id)
          })
        }
      }
    }
  }

  if (!open) return null

  return (
    <>
      <BlockingScreen />
      <DrivePicker show onClose={onPick} select="file" />
    </>
  )
}
