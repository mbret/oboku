import { Stack, styled } from "@mui/material"
import { useMemo } from "react"
import { MetadataDetectionSummary } from "./metadata/MetadataDetectionSummary"
import { MetadataForm } from "./metadata/MetadataForm"
import { resolveMetadataFormSections } from "./metadata/targets"
import { useBookOptimize } from "./BookOptimizeProvider"

const MetadataTabRootStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}))

type Props = {
  hidden: boolean
}

export function MetadataTab({ hidden }: Props) {
  const { inspection, isApplying, control } = useBookOptimize()

  const formSections = useMemo(
    () => resolveMetadataFormSections(inspection),
    [inspection],
  )

  return (
    <MetadataTabRootStack hidden={hidden}>
      <MetadataDetectionSummary />
      <MetadataForm
        control={control}
        sections={formSections}
        disabled={isApplying}
      />
    </MetadataTabRootStack>
  )
}
