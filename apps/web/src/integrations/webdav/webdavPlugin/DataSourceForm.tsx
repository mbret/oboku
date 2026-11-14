import { memo } from "react"
import { InputAdornment } from "@mui/material"
import { useForm } from "react-hook-form"
import { ControlledConnectorSelector } from "../../../common/forms/ControlledConnectorSelector"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import type { WebDAVDataSourceDocType } from "@oboku/shared"
import { TestConnection } from "../../../connectors/TestConnection"
import { useConnector } from "../../../connectors/useConnector"
import { testConnection } from "./connectors/ConnectorForm"
import { WebdavRequirementsAlert } from "./WebdavRequirementsAlert"
import { DataSourceFormLayout } from "../../plugins/common/DataSourceFormLayout"
import {
  buildDataSourceSubmitPayload,
  getDataSourceFormBaseDefaults,
} from "../../plugins/common/dataSourceFormHelpers"
import type {
  DataSourceFormData,
  DataSourceFormInternalProps,
} from "../../plugins/types"

type WebDAVFormData = DataSourceFormData<{
  connectorId: string
  directory: string
}>

export const DataSourceForm = memo(function DataSourceForm({
  dataSource,
  onSubmit,
  submitLabel,
}: DataSourceFormInternalProps<WebDAVDataSourceDocType>) {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { control, handleSubmit, watch } = useForm<WebDAVFormData>({
    mode: "onChange",
    defaultValues: {
      ...getDataSourceFormBaseDefaults(dataSource),
      connectorId: dataSource?.data_v2?.connectorId ?? "",
      directory: dataSource?.data_v2?.directory ?? "",
    },
  })
  const connectorId = watch("connectorId")
  const directory = watch("directory")
  const { data: connector } = useConnector({
    id: connectorId || undefined,
    type: "webdav",
  })

  return (
    <DataSourceFormLayout
      control={control}
      onSubmit={handleSubmit((data) =>
        onSubmit(
          buildDataSourceSubmitPayload(data, {
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
          directory: directory || undefined,
        }}
        connectorType="webdav"
        testConnection={testConnection}
      />
    </DataSourceFormLayout>
  )
})
