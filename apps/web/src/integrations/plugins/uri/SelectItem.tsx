import type { SourcePlugin } from "../types"
import { WebAddressDialog } from "./WebAddressDialog"

export const SelectItem: NonNullable<
  SourcePlugin<"URI">["SelectItemComponent"]
> = ({ open, currentLinkData, onClose }) => {
  if (!open) return null

  return (
    <WebAddressDialog
      title="Web address"
      initialLinkData={currentLinkData}
      onCancel={function keepBookFile() {
        onClose()
      }}
      onConfirm={function replaceBookFile(data) {
        onClose(undefined, { data })
      }}
    />
  )
}
