import { Stack, styled } from "@mui/material"
import { useMemo } from "react"
import { MetadataDetectionSummary } from "./metadata/MetadataDetectionSummary"
import { MetadataForm } from "./metadata/MetadataForm"
import {
  collectDetectedContainers,
  resolveMetadataFormSections,
} from "./metadata/targets"
import { useBookOptimize } from "./BookOptimizeProvider"

const MetadataTabRootStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}))

type Props = {
  hidden: boolean
}

export function MetadataTab({ hidden }: Props) {
  const { inspection, isApplying, control } = useBookOptimize()

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

  const inspectionReady = inspection !== undefined
  const metadataReadFailed = inspection?.metadataReadFailed ?? false
  const canEditMetadata = inspectionReady && !metadataReadFailed

  return (
    <MetadataTabRootStack hidden={hidden}>
      <MetadataDetectionSummary
        inspectionReady={inspectionReady}
        detectedContainers={detectedContainers}
        metadataReadFailed={metadataReadFailed}
      />
      {canEditMetadata && (
        <MetadataForm
          control={control}
          sections={formSections}
          disabled={isApplying}
        />
      )}
    </MetadataTabRootStack>
  )
}
