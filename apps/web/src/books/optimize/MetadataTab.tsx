import { Stack, styled } from "@mui/material"
import { MetadataDetectionSummary } from "./metadata/MetadataDetectionSummary"
import { MetadataForm } from "./metadata/MetadataForm"

const MetadataTabRootStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}))

type Props = {
  hidden: boolean
}

export function MetadataTab({ hidden }: Props) {
  return (
    <MetadataTabRootStack hidden={hidden}>
      <MetadataDetectionSummary />
      <MetadataForm />
    </MetadataTabRootStack>
  )
}
