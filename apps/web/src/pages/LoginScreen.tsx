import { Button, Box, Stack } from "@mui/material"
import { Alert } from "@mui/material"
import { Email, Google, PersonAdd } from "@mui/icons-material"
import { useSignIn } from "../auth/useSignIn"
import { OrDivider } from "../common/OrDivider"
import { isCancelError } from "../errors/errors.shared"
import { ErrorMessage } from "../errors/ErrorMessage"
import { configuration } from "../config/configuration"
import { SignInForm } from "../auth/SignInForm"
import { Link } from "react-router"
import { ROUTES } from "../navigation/routes"
import { AuthPage } from "../auth/AuthPage"

export const LoginScreen = () => {
  const { mutate, isPending, error } = useSignIn()

  return (
    <AuthPage>
      {error && !isCancelError(error) ? (
        <Box mb={2}>
          <Alert severity="warning">
            <ErrorMessage error={error} />
          </Alert>
        </Box>
      ) : null}
      <SignInForm
        onSubmit={(data) => {
          mutate(data)
        }}
      />
      <Button variant="text" disabled sx={{ textTransform: "none", mt: 1 }}>
        I forgot my password
      </Button>
      <OrDivider title="or" />
      <Stack gap={1}>
        <Button
          onClick={() => mutate(undefined)}
          size="large"
          startIcon={<Google />}
          disabled={!configuration.FEATURE_GOOGLE_SIGN_ENABLED || isPending}
        >
          Sign in with Google
        </Button>
        <Button
          component={Link}
          to={ROUTES.SIGN_UP}
          size="large"
          startIcon={<PersonAdd />}
        >
          Sign up
        </Button>
        <Button onClick={() => {}} size="large" startIcon={<Email />} disabled>
          Sign in with magic link
        </Button>
      </Stack>
    </AuthPage>
  )
}
