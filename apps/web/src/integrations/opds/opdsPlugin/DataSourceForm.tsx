import { memo } from "react"
import { Alert, Link } from "@mui/material"
import { useForm } from "react-hook-form"
import {
  getOpdsUrlOrigin,
  isOpdsConnectorOrigin,
  links,
  type OpdsDataSourceDocType,
} from "@oboku/shared"
import { ControlledConnectorSelector } from "../../../common/forms/ControlledConnectorSelector"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import { useConnectors } from "../../../connectors/useConnectors"
import { DataSourceFormLayout } from "../../plugins/common/DataSourceFormLayout"
import {
  buildDataSourceSubmitPayload,
  getDataSourceFormBaseDefaults,
} from "../../plugins/common/dataSourceFormHelpers"
import type {
  DataSourceFormData,
  DataSourceFormInternalProps,
} from "../../plugins/types"

type OpdsFormData = DataSourceFormData<{
  connectorId: string
  feedUrl: string
}>

export const DataSourceForm = memo(function DataSourceForm({
  dataSource,
  onSubmit,
  submitLabel,
}: DataSourceFormInternalProps<OpdsDataSourceDocType>) {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { data: connectors } = useConnectors({ type: "opds" })
  const { control, handleSubmit } = useForm<OpdsFormData>({
    mode: "onChange",
    defaultValues: {
      ...getDataSourceFormBaseDefaults(dataSource),
      connectorId: dataSource?.data_v2?.connectorId ?? "",
      feedUrl: dataSource?.data_v2?.feedUrl ?? "",
    },
  })

  const validateFeedUrl = (
    feedUrl: string,
    { connectorId }: Pick<OpdsFormData, "connectorId">,
  ) => {
    const trimmedFeedUrl = feedUrl.trim()
    const isHttpUrl = getOpdsUrlOrigin(trimmedFeedUrl) !== undefined
    const connectorUrl = connectors?.find(({ id }) => id === connectorId)?.url

    if (!isHttpUrl) {
      return "Enter the full address of the feed, starting with http:// or https://"
    }

    if (connectorUrl === undefined) return true

    return (
      isOpdsConnectorOrigin(trimmedFeedUrl, connectorUrl) ||
      `The feed has to be on the connector's server, ${getOpdsUrlOrigin(connectorUrl) ?? connectorUrl}`
    )
  }

  return (
    <DataSourceFormLayout
      control={control}
      onSubmit={handleSubmit(function submitDataSource(data) {
        onSubmit(
          buildDataSourceSubmitPayload(data, {
            connectorId: data.connectorId,
            feedUrl: data.feedUrl.trim(),
          }),
        )
      })}
      submitLabel={submitLabel}
    >
      <Alert severity="warning">
        Books download from your browser, straight from your catalog, which has
        to allow it. Make sure to{" "}
        <Link href={links.documentationOpds}>read this</Link> before proceeding.
      </Alert>
      <ControlledConnectorSelector
        control={control}
        name="connectorId"
        rules={{ required: true, deps: "feedUrl" }}
        connectorType="opds"
      />
      <ControlledTextField
        name="feedUrl"
        label="Feed URL"
        control={control}
        rules={{ required: true, validate: validateFeedUrl }}
        fullWidth
        helperText="Pick a feed rather than the root of the catalog, like its list of series. Each of its sections becomes a collection."
      />
    </DataSourceFormLayout>
  )
})
