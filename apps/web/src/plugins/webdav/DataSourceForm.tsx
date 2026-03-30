import { memo } from "react"
import { Alert, InputAdornment, Link } from "@mui/material"
import { Controller, useForm } from "react-hook-form"
import { ControlledTextField } from "../../common/forms/ControlledTextField"
import { errorToHelperText } from "../../common/forms/errorToHelperText"
import { links } from "@oboku/shared"
import type { WebDAVDataSourceDocType } from "@oboku/shared"
import { ConnectorSelector } from "../../connectors/ConnectorSelector"
import { TestConnection } from "../../connectors/TestConnection"
import { useConnector } from "../../connectors/useConnector"
import { testConnection } from "./connectors/ConnectorForm"
import { DataSourceFormLayout } from "../DataSourceFormLayout"
import type { DataSourceFormData, DataSourceFormInternalProps } from "../types"

type WebDAVFormData = DataSourceFormData<{
  connectorId: string
  directory: string
}>

export const DataSourceForm = memo(
  ({
    dataSource,
    onSubmit,
    submitLabel,
  }: DataSourceFormInternalProps<WebDAVDataSourceDocType>) => {
    const { control, handleSubmit, watch } = useForm<WebDAVFormData>({
      mode: "onChange",
      defaultValues: {
        name: dataSource?.name ?? "",
        tags: [...(dataSource?.tags ?? [])],
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
          onSubmit({
            name: data.name,
            tags: data.tags,
            data_v2: {
              connectorId: data.connectorId,
              directory: data.directory,
            },
          }),
        )}
        submitLabel={submitLabel}
      >
        <Alert severity="warning">
          Connecting to WebDAV server involves several requirements, make sure
          to <Link href={links.documentationConnectors}>read this</Link> before
          proceeding.
        </Alert>
        <ControlledTextField
          name="directory"
          label="Directory"
          control={control}
          rules={{ required: false }}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">/</InputAdornment>
              ),
            },
          }}
        />
        <Controller
          control={control}
          name="connectorId"
          rules={{ required: true }}
          render={({ field, fieldState }) => (
            <ConnectorSelector
              {...field}
              connectorType="webdav"
              helperText={
                fieldState.invalid
                  ? errorToHelperText(fieldState.error)
                  : undefined
              }
              error={fieldState.invalid}
            />
          )}
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
  },
)
