import { Stack, type StackProps } from "@mui/material"

export const Page = ({
  children,
  ...props
}: { children: React.ReactNode } & StackProps) => {
  return (
    <Stack flex={1} overflow={"auto"} pb={4} {...props}>
      {children}
    </Stack>
  )
}
