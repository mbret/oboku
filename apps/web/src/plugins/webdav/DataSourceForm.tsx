import { memo } from "react"
import type { DataSourceFormData } from "../types"
import { Alert, InputAdornment, Link } from "@mui/material"
import type { Control, UseFormWatch } from "react-hook-form"
import { ControlledTextField } from "../../common/forms/ControlledTextField"
import { links, type WebDAVDataSourceDocType } from "@oboku/shared"
import { useConnectors } from "./connectors/useConnectors"
import { ControlledTextFieldSelect } from "../../common/forms/ControlledTextFieldSelect"
import { LinkRounded } from "@mui/icons-material"
import { TestConnection } from "./connectors/TestConnection"
import { useConnector } from "./connectors/useConnector"

export const DataSourceForm = memo(
  ({
    control,
    watch,
  }: {
    control: Control<DataSourceFormData, any, DataSourceFormData>
    watch: UseFormWatch<DataSourceFormData>
  }) => {
    const data = watch("data") as WebDAVDataSourceDocType["data_v2"]
    const { data: connectors } = useConnectors()
    const { data: connector } = useConnector(data?.connectorId)

    return (
      <>
        <Alert severity="warning">
          Connecting to WebDAV server involves several requirements, make sure
          to <Link href={links.documentationWebDAV}>read this</Link> before
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
        <ControlledTextFieldSelect
          options={
            connectors?.map((connector) => ({
              label: `${connector.url}@${connector.username}`,
              value: connector.id,
              id: connector.id,
            })) ?? []
          }
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LinkRounded />
                </InputAdornment>
              ),
            },
          }}
          helperText="Select a connector to use"
          name="data.connectorId"
          fullWidth
          rules={{ required: true }}
          control={control}
        />
        <TestConnection
          url={connector?.url}
          username={connector?.username}
          passwordAsSecretId={connector?.passwordAsSecretId}
          directory={data?.directory}
        />
      </>
    )
  },
)
