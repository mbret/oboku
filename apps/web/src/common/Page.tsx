import { Stack, type StackProps } from "@mui/material"

export const Page = ({
  children,
  bottomGutter = true,
  ...props
}: { children: React.ReactNode } & StackProps & {
    bottomGutter?: boolean
  }) => {
  return (
    <Stack
      {...props}
      sx={[
        {
          flex: 1,
          overflow: "auto",
          pb: bottomGutter ? 4 : 0,
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    >
      {children}
    </Stack>
  )
}
