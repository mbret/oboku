import { memo } from "react"
import { InputAdornment } from "@mui/material"
import { useForm } from "react-hook-form"
import { ControlledConnectorSelector } from "../../../common/forms/ControlledConnectorSelector"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import type { WebDAVLibrarySyncDocType } from "@oboku/shared"
import { isProxiedThroughServer } from "../../../connectors/connectorDetails"
import { TestConnection } from "../../../connectors/TestConnection"
import { useConnector } from "../../../connectors/useConnector"
import { useTestWebdavConnection } from "./useTestWebdavConnection"
import { WebdavRequirementsAlert } from "./WebdavRequirementsAlert"
import { LibrarySyncFormLayout } from "../../plugins/common/LibrarySyncFormLayout"
import {
  buildLibrarySyncSubmitPayload,
  getLibrarySyncFormBaseDefaults,
} from "../../plugins/common/librarySyncFormHelpers"
import type {
  LibrarySyncFormData,
  LibrarySyncFormInternalProps,
} from "../../plugins/types"

type WebDAVFormData = LibrarySyncFormData<{
  connectorId: string
  directory: string
}>

export const LibrarySyncForm = memo(function LibrarySyncForm({
  librarySync,
  onSubmit,
  submitLabel,
}: LibrarySyncFormInternalProps<WebDAVLibrarySyncDocType>) {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { control, handleSubmit, watch } = useForm<WebDAVFormData>({
    mode: "onChange",
    defaultValues: {
      ...getLibrarySyncFormBaseDefaults(librarySync),
      connectorId: librarySync?.data_v2?.connectorId ?? "",
      directory: librarySync?.data_v2?.directory ?? "",
    },
  })
  const connectorId = watch("connectorId")
  const directory = watch("directory")
  const { data: connector } = useConnector({
    id: connectorId || undefined,
    type: "webdav",
  })
  const testConnection = useTestWebdavConnection()

  return (
    <LibrarySyncFormLayout
      control={control}
      onSubmit={handleSubmit((data) =>
        onSubmit(
          buildLibrarySyncSubmitPayload(data, {
            connectorId: data.connectorId,
            directory: data.directory,
          }),
        ),
      )}
      submitLabel={submitLabel}
    >
      <WebdavRequirementsAlert />
      <ControlledTextField
        name="directory"
        label="Directory"
        control={control}
        rules={{ required: false }}
        fullWidth
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start">/</InputAdornment>,
          },
        }}
      />
      <ControlledConnectorSelector
        control={control}
        name="connectorId"
        rules={{ required: true }}
        connectorType="webdav"
      />
      <TestConnection
        connectionData={{
          url: connector?.url ?? "",
          username: connector?.username ?? "",
          passwordAsSecretId: connector?.passwordAsSecretId ?? "",
          allowSelfSigned: connector?.allowSelfSigned,
          proxyThroughServer: isProxiedThroughServer(connector),
          directory: directory || undefined,
        }}
        connectorType="webdav"
        testConnection={testConnection}
      />
    </LibrarySyncFormLayout>
  )
})
