import { useTheme, Button, Box, Link, Typography, Stack } from "@mui/material"
import { Alert } from "@mui/material"
import { Google } from "@mui/icons-material"
import { useSignIn } from "./useSignIn"
import { OrDivider } from "../common/OrDivider"
import { links } from "@oboku/shared"
import { Logo } from "../common/Logo"
import { isCancelError } from "../errors/errors.shared"
import { ErrorMessage } from "../errors/ErrorMessage"
import { useMutation$ } from "reactjrx"

export const LoginScreen = () => {
  const { signIn } = useSignIn()
  const { mutate, isPending, error } = useMutation$({
    mutationFn: signIn,
  })
  const theme = useTheme()

  return (
    <Stack
      flex={1}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={3}
      px={2}
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
      <Stack maxWidth={400}>
        {error && !isCancelError(error) ? (
          <Box mb={2}>
            <Alert severity="warning">
              <ErrorMessage error={error} />
            </Alert>
          </Box>
        ) : null}
        <Button
          onClick={() => mutate()}
          size="large"
          startIcon={<Google />}
          disabled={isPending}
        >
          Sign in with Google
        </Button>
        <Box mt={2}>
          <Alert severity="info" variant="outlined">
            Want more choices? Please let us know on{" "}
            <Link href={links.discord}>discord</Link>
          </Alert>
        </Box>
        <OrDivider title="more" />
        <Typography textAlign="center">
          Visit <Link href={links.site}>oboku</Link> for more information or
          help
        </Typography>
      </Stack>
    </Stack>
  )
}
