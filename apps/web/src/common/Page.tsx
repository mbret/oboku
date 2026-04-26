import { Stack, type StackProps, styled } from "@mui/material"

const StyledRoot = styled(Stack, {
  shouldForwardProp: (prop) => prop !== "bottomGutter",
})<{ bottomGutter?: boolean }>(({ theme, bottomGutter }) => ({
  flex: 1,
  overflow: "auto",
  paddingBottom: bottomGutter ? theme.spacing(4) : 0,
}))

export const Page = ({
  children,
  bottomGutter = true,
  ...props
}: { children: React.ReactNode; bottomGutter?: boolean } & StackProps) => {
  return (
    <StyledRoot bottomGutter={bottomGutter} {...props}>
      {children}
    </StyledRoot>
  )
}
