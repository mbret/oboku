import {
  useTheme,
  Box,
  Link as MuiLink,
  Typography,
  Stack,
  type StackProps,
  styled,
} from "@mui/material"
import { links } from "@oboku/shared"
import { Logo } from "../common/Logo"

const StyledRoot = styled(Stack)(({ theme }) => ({
  flex: 1,
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: theme.spacing(3),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
}))

export const AuthPage = ({
  children,
  ...props
}: { children: React.ReactNode } & StackProps) => {
  const theme = useTheme()

  return (
    <StyledRoot {...props}>
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
    </StyledRoot>
  )
}
