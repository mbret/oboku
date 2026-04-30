import { memo } from "react"
import { Controller, useForm } from "react-hook-form"
import { errorToHelperText } from "../../common/forms/errorToHelperText"
import { ConnectorSelector } from "../../connectors/ConnectorSelector"
import { DataSourceFormLayout } from "../common/DataSourceFormLayout"
import {
  buildDataSourceSubmitPayload,
  getDataSourceFormBaseDefaults,
} from "../common/dataSourceFormHelpers"
import type { ServerDataSourceDocType } from "@oboku/shared"
import type { DataSourceFormData, DataSourceFormInternalProps } from "../types"

type ServerFormData = DataSourceFormData<{
  connectorId: string
}>

export const DataSourceForm = memo(
  ({
    dataSource,
    onSubmit,
    submitLabel,
  }: DataSourceFormInternalProps<ServerDataSourceDocType>) => {
    const { control, handleSubmit } = useForm<ServerFormData>({
      mode: "onChange",
      defaultValues: {
        ...getDataSourceFormBaseDefaults(dataSource),
        connectorId: dataSource?.data_v2?.connectorId ?? "",
      },
    })

    return (
      <DataSourceFormLayout
        control={control}
        onSubmit={handleSubmit((data) =>
          onSubmit(
            buildDataSourceSubmitPayload(data, {
              connectorId: data.connectorId,
            }),
          ),
        )}
        submitLabel={submitLabel}
      >
        <Controller
          control={control}
          name="connectorId"
          rules={{ required: true }}
          render={({ field, fieldState }) => (
            <ConnectorSelector
              {...field}
              connectorType="server"
              helperText={
                fieldState.invalid
                  ? errorToHelperText(fieldState.error)
                  : undefined
              }
              error={fieldState.invalid}
            />
          )}
        />
      </DataSourceFormLayout>
    )
  },
)
