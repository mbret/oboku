import { memo } from "react"
import { useForm } from "react-hook-form"
import { ControlledConnectorSelector } from "../../../common/forms/ControlledConnectorSelector"
import { LibrarySyncFormLayout } from "../../plugins/common/LibrarySyncFormLayout"
import {
  buildLibrarySyncSubmitPayload,
  getLibrarySyncFormBaseDefaults,
} from "../../plugins/common/librarySyncFormHelpers"
import type { ServerLibrarySyncDocType } from "@oboku/shared"
import type {
  LibrarySyncFormData,
  LibrarySyncFormInternalProps,
} from "../../plugins/types"

type ServerFormData = LibrarySyncFormData<{
  connectorId: string
}>

export const LibrarySyncForm = memo(function LibrarySyncForm({
  librarySync,
  onSubmit,
  submitLabel,
}: LibrarySyncFormInternalProps<ServerLibrarySyncDocType>) {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { control, handleSubmit } = useForm<ServerFormData>({
    mode: "onChange",
    defaultValues: {
      ...getLibrarySyncFormBaseDefaults(librarySync),
      connectorId: librarySync?.data_v2?.connectorId ?? "",
    },
  })

  return (
    <LibrarySyncFormLayout
      control={control}
      onSubmit={handleSubmit((data) =>
        onSubmit(
          buildLibrarySyncSubmitPayload(data, {
            connectorId: data.connectorId,
          }),
        ),
      )}
      submitLabel={submitLabel}
    >
      <ControlledConnectorSelector
        control={control}
        name="connectorId"
        rules={{ required: true }}
        connectorType="server"
      />
    </LibrarySyncFormLayout>
  )
})
