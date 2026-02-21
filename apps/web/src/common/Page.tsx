import { Stack, useTheme, type StackProps } from "@mui/material"

export const Page = ({
  children,
  bottomGutter = true,
  ...props
}: { children: React.ReactNode } & StackProps & {
    bottomGutter?: boolean
  }) => {
  const theme = useTheme()

  console.log("theme", theme)
  return (
    <Stack flex={1} overflow={"auto"} pb={bottomGutter ? 4 : 0} {...props}>
      {children}
    </Stack>
  )
}
