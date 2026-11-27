import { memo } from "react"
import { Alert, Link } from "@mui/material"
import { useForm } from "react-hook-form"
import {
  getOpdsUrlOrigin,
  isOpdsConnectorOrigin,
  links,
  type OpdsLibrarySyncDocType,
} from "@oboku/shared"
import { ControlledConnectorSelector } from "../../../common/forms/ControlledConnectorSelector"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import { isHttpUrl } from "../../../common/network/isHttpUrl"
import { useConnectors } from "../../../connectors/useConnectors"
import { LibrarySyncFormLayout } from "../../plugins/common/LibrarySyncFormLayout"
import {
  buildLibrarySyncSubmitPayload,
  getLibrarySyncFormBaseDefaults,
} from "../../plugins/common/librarySyncFormHelpers"
import type {
  LibrarySyncFormData,
  LibrarySyncFormInternalProps,
} from "../../plugins/types"

type OpdsFormData = LibrarySyncFormData<{
  connectorId: string
  feedUrl: string
}>

export const LibrarySyncForm = memo(function LibrarySyncForm({
  librarySync,
  onSubmit,
  submitLabel,
}: LibrarySyncFormInternalProps<OpdsLibrarySyncDocType>) {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { data: connectors } = useConnectors({ type: "opds" })
  const { control, handleSubmit } = useForm<OpdsFormData>({
    mode: "onChange",
    defaultValues: {
      ...getLibrarySyncFormBaseDefaults(librarySync),
      connectorId: librarySync?.data_v2?.connectorId ?? "",
      feedUrl: librarySync?.data_v2?.feedUrl ?? "",
    },
  })

  const validateFeedUrl = (
    feedUrl: string,
    { connectorId }: Pick<OpdsFormData, "connectorId">,
  ) => {
    const trimmedFeedUrl = feedUrl.trim()
    const connectorUrl = connectors?.find(({ id }) => id === connectorId)?.url

    if (!isHttpUrl(trimmedFeedUrl)) {
      return "Enter the full address of the feed, starting with http:// or https://"
    }

    if (connectorUrl === undefined) return true

    return (
      isOpdsConnectorOrigin(trimmedFeedUrl, connectorUrl) ||
      `The feed has to be on the connector's server, ${getOpdsUrlOrigin(connectorUrl) ?? connectorUrl}`
    )
  }

  return (
    <LibrarySyncFormLayout
      control={control}
      onSubmit={handleSubmit(function submitLibrarySync(data) {
        onSubmit(
          buildLibrarySyncSubmitPayload(data, {
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
        <Link href={links.documentationOpds} target="_blank">
          read this
        </Link>{" "}
        before proceeding.
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
    </LibrarySyncFormLayout>
  )
})
