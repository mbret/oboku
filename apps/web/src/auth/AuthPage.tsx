import {
  useTheme,
  Box,
  Link as MuiLink,
  Typography,
  Stack,
  type StackProps,
} from "@mui/material"
import { links } from "@oboku/shared"
import { Logo } from "../common/Logo"

export const AuthPage = ({
  children,
  ...props
}: { children: React.ReactNode } & StackProps) => {
  const theme = useTheme()

  return (
    <Stack
      {...props}
      sx={[
        {
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          px: 2,
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    >
      <Box
        style={{
          display: "flex",
          justifyContent: "center",
          flexFlow: "row",
          paddingBottom: theme.spacing(4),
        }}
      >
        <Logo />
      </Box>
      <Stack
        sx={{
          maxWidth: 400,
          width: "100%",
          justifyContent: "center",
        }}
      >
        {children}
        <Typography
          sx={{
            textAlign: "center",
            mt: 10,
          }}
        >
          <MuiLink href={links.site}>oboku</MuiLink> - Copyright © 2020-
          {new Date().getFullYear()}{" "}
        </Typography>
      </Stack>
    </Stack>
  )
}
