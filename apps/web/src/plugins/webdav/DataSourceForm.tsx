import { memo } from "react"
import type { DataSourceFormData } from "../types"
import { Alert, InputAdornment, Link } from "@mui/material"
import type { Control, UseFormWatch } from "react-hook-form"
import { Controller } from "react-hook-form"
import { ControlledTextField } from "../../common/forms/ControlledTextField"
import { errorToHelperText } from "../../common/forms/errorToHelperText"
import { links, type WebDAVDataSourceDocType } from "@oboku/shared"
import { ConnectorSelector } from "../../connectors/ConnectorSelector"
import { TestConnection } from "../../connectors/TestConnection"
import { useConnector } from "../../connectors/useConnector"
import { testConnection } from "./connectors/ConnectorForm"

export const DataSourceForm = memo(
  ({
    control,
    watch,
  }: {
    control: Control<DataSourceFormData, unknown, DataSourceFormData>
    watch: UseFormWatch<DataSourceFormData>
  }) => {
    const data = watch("data") as WebDAVDataSourceDocType["data_v2"]
    const { data: connector } = useConnector({
      id: data?.connectorId,
      type: "webdav",
    })

    return (
      <>
        <Alert severity="warning">
          Connecting to WebDAV server involves several requirements, make sure
          to <Link href={links.documentationConnectors}>read this</Link> before
          proceeding.
        </Alert>
        <ControlledTextField
          name="data.directory"
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
          name="data.connectorId"
          rules={{ required: true }}
          render={({ field, fieldState }) => (
            <ConnectorSelector
              {...field}
              connectorType="webdav"
              showManagementButtons={false}
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
            directory: data?.directory,
          }}
          connectorType="webdav"
          testConnection={testConnection}
        />
      </>
    )
  },
)
