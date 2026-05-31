import { Stack, styled } from "@mui/material"
import { useBookOptimize } from "./BookOptimizeProvider"
import { ContentReport } from "./content/ContentReport"
import { ImageCompressionOption } from "./content/ImageCompressionOption"

const ContentTabRootStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}))

type Props = {
  hidden: boolean
}

export function ContentTab({ hidden }: Props) {
  const { inspection, isApplying, control } = useBookOptimize()

  return (
    <ContentTabRootStack hidden={hidden}>
      <ContentReport inspection={inspection} />
      <ImageCompressionOption control={control} disabled={isApplying} />
    </ContentTabRootStack>
  )
}
