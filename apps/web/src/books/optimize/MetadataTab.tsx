import { CloudUploadOutlined, SaveOutlined } from "@mui/icons-material"
import { Button, Stack, styled } from "@mui/material"
import type { BookDocType, LinkDocType } from "@oboku/shared"
import { useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import type { DeepReadonlyObject } from "rxdb"
import { showDialog } from "../../common/dialogs/createDialog"
import { createConfirmDialogOptions } from "../../common/dialogs/presets"
import { CancelError } from "../../errors/errors.shared"
import { notify, notifyError } from "../../notifications/toasts"
import { useApplyMetadataFix } from "./metadata/useApplyMetadataFix"
import { useFileInspection } from "./metadata/useFileInspection"
import { MetadataDetectionSummary } from "./metadata/MetadataDetectionSummary"
import { MetadataForm } from "./metadata/MetadataForm"
import {
  collectDetectedContainers,
  EMPTY_METADATA_FIXER_FORM_VALUES,
  resolveArchiveMetadataPatchPlans,
  resolveMetadataFixerFormValues,
  resolveMetadataFormSections,
  trimMetadataFixerFormValues,
} from "./metadata/targets"
import type { MetadataFixerFormValues } from "./metadata/types"
import { TestBookButton } from "./TestBookButton"

const MetadataTabRootStack = styled(Stack)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  gap: theme.spacing(2),
}))

const ActionsStack = styled(Stack)(({ theme }) => ({
  marginTop: "auto",
  gap: theme.spacing(1),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
}))

type Props = {
  book: DeepReadonlyObject<BookDocType>
  link: DeepReadonlyObject<LinkDocType>
  canUploadToDataSource: boolean
  hidden: boolean
}

export function MetadataTab({
  book,
  link,
  canUploadToDataSource,
  hidden,
}: Props) {
  const metadataFormKey = `${book._id}:${link._id}`
  const metadataFormKeyRef = useRef(metadataFormKey)
  const isMetadataFormCurrent = metadataFormKeyRef.current === metadataFormKey
  const { data: inspectionData, refetch: refetchInspection } =
    useFileInspection({
      bookId: book._id,
      enabled: true,
    })

  const inspection = inspectionData ?? undefined
  const detectedContainers = inspection
    ? collectDetectedContainers({
        hasOpf: inspection.hasOpf,
        hasComicInfo: inspection.hasComicInfo,
      })
    : []
  const formSections = useMemo(
    () => resolveMetadataFormSections(inspection),
    [inspection],
  )
  const resolvedFormValues = useMemo(
    () => resolveMetadataFixerFormValues(inspection),
    [inspection],
  )

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<MetadataFixerFormValues>({
    defaultValues: EMPTY_METADATA_FIXER_FORM_VALUES,
    mode: "onChange",
  })

  useEffect(() => {
    if (!isMetadataFormCurrent) {
      metadataFormKeyRef.current = metadataFormKey
      reset(resolvedFormValues)
      return
    }

    if (isDirty) return
    reset(resolvedFormValues)
  }, [
    isDirty,
    isMetadataFormCurrent,
    metadataFormKey,
    reset,
    resolvedFormValues,
  ])

  const {
    mutate: applyMetadataFix,
    isPending: isApplying,
    slot: upsertSlot,
    variables: applyMetadataFixVariables,
    uploadProgress$,
  } = useApplyMetadataFix()

  function applyMetadata(
    values: MetadataFixerFormValues,
    { uploadToDataSource }: { uploadToDataSource: boolean },
  ) {
    const trimmedValues = trimMetadataFixerFormValues(values)
    const patches = resolveArchiveMetadataPatchPlans(trimmedValues, inspection)

    applyMetadataFix(
      {
        bookId: book._id,
        link,
        patches,
        uploadToDataSource,
      },
      {
        onSuccess: () => {
          if (metadataFormKeyRef.current !== metadataFormKey) return

          reset(trimmedValues)
          void refetchInspection()
          notify({
            title: "Metadata applied",
            description: uploadToDataSource
              ? "Metadata was saved locally and uploaded to the data source."
              : "Metadata was saved to the downloaded file on this device.",
            severity: "success",
          })
        },
        onError: (error) => {
          if (error instanceof CancelError) return

          notifyError(error)
        },
      },
    )
  }

  const isUploading =
    isApplying && applyMetadataFixVariables?.uploadToDataSource === true
  const isApplyingLocally =
    isApplying && applyMetadataFixVariables?.uploadToDataSource === false
  const inspectionReady = inspection !== undefined
  const canApplyLocally =
    isMetadataFormCurrent &&
    inspectionReady &&
    !isApplying &&
    isDirty &&
    isValid
  const canUploadMetadata =
    isMetadataFormCurrent &&
    inspectionReady &&
    !isApplying &&
    canUploadToDataSource &&
    isValid
  const applyLocallyVariant = canUploadMetadata ? "outlined" : "contained"
  const uploadVariant = canUploadMetadata ? "contained" : "outlined"

  function applyLocally(values: MetadataFixerFormValues) {
    if (!canApplyLocally) return

    applyMetadata(values, { uploadToDataSource: false })
  }

  async function uploadMetadataToDataSource(values: MetadataFixerFormValues) {
    if (!canUploadMetadata) return

    try {
      await showDialog(
        createConfirmDialogOptions({
          message:
            "This will overwrite the file on the remote data source with the current local file.",
        }),
      ).promise
    } catch (error) {
      if (error instanceof CancelError) return

      throw error
    }

    applyMetadata(values, { uploadToDataSource: true })
  }

  return (
    <>
      {upsertSlot}
      <MetadataTabRootStack hidden={hidden}>
        <MetadataDetectionSummary
          inspectionReady={inspectionReady}
          detectedContainers={detectedContainers}
          metadataReadFailed={inspection?.metadataReadFailed ?? false}
        />
        {inspectionReady && (
          <MetadataForm
            control={control}
            sections={formSections}
            isApplying={isApplying}
            isUploading={isUploading}
            uploadProgress$={uploadProgress$}
            onSubmit={handleSubmit(applyLocally)}
          />
        )}
        <ActionsStack>
          <Button
            variant={applyLocallyVariant}
            fullWidth
            disabled={!canApplyLocally}
            startIcon={<SaveOutlined />}
            onClick={() => {
              void handleSubmit(applyLocally)()
            }}
          >
            {isApplyingLocally ? "Applying locally…" : "Apply locally"}
          </Button>
          <Button
            variant={uploadVariant}
            fullWidth
            disabled={!canUploadMetadata}
            startIcon={<CloudUploadOutlined />}
            onClick={() => {
              void handleSubmit(uploadMetadataToDataSource)()
            }}
          >
            {isUploading ? "Uploading…" : "Upload to data source"}
          </Button>
          <TestBookButton bookId={book._id} />
        </ActionsStack>
      </MetadataTabRootStack>
    </>
  )
}
