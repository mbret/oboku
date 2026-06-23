import { Stack, styled } from "@mui/material"
import { ContentReport } from "./content/ContentReport"
import { ImageCompressionOption } from "./content/ImageCompressionOption"

const ContentTabRootStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}))

type Props = {
  hidden: boolean
}

export function ContentTab({ hidden }: Props) {
  return (
    <ContentTabRootStack hidden={hidden}>
      <ContentReport />
      <ImageCompressionOption />
    </ContentTabRootStack>
  )
}
