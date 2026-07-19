import { Stack, Typography, styled } from "@mui/material"
import { normalizeIsbn } from "@prose-reader/archive-reader"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import type { BookOptimizeFormValues } from "../form"
import { useBookOptimize } from "../BookOptimizeProvider"
import { CONTAINER_LABELS } from "./targets"
import type { MetadataFixerFormValues } from "./types"

const validateIsbn = (raw: string | boolean): true | string => {
  if (typeof raw !== "string") return true

  const trimmed = raw.trim()

  if (trimmed === "") return true

  return normalizeIsbn(trimmed) !== undefined
    ? true
    : "Not a recognizable ISBN-10 or ISBN-13"
}

const MetadataSectionStack = styled(Stack)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  gap: theme.spacing(1),
  padding: theme.spacing(1.5),
}))

type IsbnSectionProps = {
  label: string
  fieldName: keyof MetadataFixerFormValues
  detectedIsbn: string | undefined
}

function IsbnSection({ label, fieldName, detectedIsbn }: IsbnSectionProps) {
  const { control, isApplyingLocally, isUploading } = useBookOptimize()
  const isApplying = isApplyingLocally || isUploading

  return (
    <MetadataSectionStack>
      <Typography variant="subtitle2">{label}</Typography>
      <ControlledTextField<BookOptimizeFormValues>
        name={fieldName}
        control={control}
        rules={{ validate: validateIsbn }}
        label="ISBN"
        size="small"
        fullWidth
        helperText={detectedIsbn ? undefined : "No ISBN found."}
        disabled={isApplying}
      />
    </MetadataSectionStack>
  )
}

export function MetadataForm() {
  const { inspection } = useBookOptimize()
  const { hasComicInfo, hasOpf, comicInfoIsbn, opfIsbn } = inspection
  const hasNoContainer = !hasComicInfo && !hasOpf

  return (
    <Stack spacing={2}>
      {(hasComicInfo || hasNoContainer) && (
        <IsbnSection
          label={CONTAINER_LABELS.comicInfo}
          fieldName="comicInfoIsbn"
          detectedIsbn={hasNoContainer ? undefined : comicInfoIsbn}
        />
      )}
      {hasOpf && (
        <IsbnSection
          label={CONTAINER_LABELS.opf}
          fieldName="opfIsbn"
          detectedIsbn={opfIsbn}
        />
      )}
    </Stack>
  )
}
