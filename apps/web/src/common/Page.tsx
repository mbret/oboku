import { memo, type Ref } from "react"
import { Stack, type StackProps, styled } from "@mui/material"

const StyledRoot = styled(Stack, {
  shouldForwardProp: (prop) => prop !== "bottomGutter",
})<{ bottomGutter?: boolean }>(({ theme, bottomGutter }) => ({
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  paddingBottom: bottomGutter ? theme.spacing(4) : 0,
}))

function PageComponent({
  children,
  bottomGutter = true,
  ref,
  ...props
}: {
  children: React.ReactNode
  bottomGutter?: boolean
  ref?: Ref<HTMLDivElement>
} & StackProps) {
  return (
    <StyledRoot ref={ref} bottomGutter={bottomGutter} {...props}>
      {children}
    </StyledRoot>
  )
}

export const Page = memo(PageComponent)
