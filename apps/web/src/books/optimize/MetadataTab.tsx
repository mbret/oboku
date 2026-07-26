import { Stack, styled } from "@mui/material"
import { MetadataForm } from "./metadata/MetadataForm"
import { MetadataReport } from "./metadata/MetadataReport"
import { MetadataWarnings } from "./metadata/MetadataWarnings"

const MetadataTabRootStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}))

type Props = {
  hidden: boolean
}

export function MetadataTab({ hidden }: Props) {
  return (
    <MetadataTabRootStack hidden={hidden}>
      <MetadataReport />
      <MetadataWarnings />
      <MetadataForm />
    </MetadataTabRootStack>
  )
}
