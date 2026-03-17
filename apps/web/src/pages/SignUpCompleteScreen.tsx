import { Alert, Box, Button, Stack } from "@mui/material"
import { Home, Login } from "@mui/icons-material"
import { Link, useSearchParams } from "react-router"
import { AuthPage } from "../auth/AuthPage"
import { CompleteSignUpForm } from "../auth/CompleteSignUpForm"
import { useCompleteSignUp } from "../auth/useCompleteSignUp"
import { isCancelError } from "../errors/errors.shared"
import { ErrorAlert } from "../errors/ErrorMessage"
import { ROUTES } from "../navigation/routes"
import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { useSignalValue } from "reactjrx"
import { authStateSignal } from "../auth/states.web"

export const SignUpCompleteScreen = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const auth = useSignalValue(authStateSignal)
  const isAuthenticated = !!auth?.accessToken
  const { mutate, error } = useCompleteSignUp()

  return (
    <AuthPage>
      {isAuthenticated ? (
        <Box mb={2}>
          <Alert severity="warning">
            You are already signed in. Sign out first if you want to complete
            this sign up.
          </Alert>
        </Box>
      ) : null}
      {!token ? (
        <Box mb={2}>
          <ErrorAlert
            error={
              new ObokuSharedError(
                ObokuErrorCode.ERROR_SIGNUP_LINK_MISSING_TOKEN,
                undefined,
                "user",
              )
            }
          />
        </Box>
      ) : null}
      {error && !isCancelError(error) ? (
        <Box mb={2}>
          <ErrorAlert error={error} />
        </Box>
      ) : null}
      {token ? (
        <CompleteSignUpForm
          onSubmit={(data) => {
            mutate({
              token,
              password: data.password,
            })
          }}
        />
      ) : null}
      <Stack gap={1} mt={3}>
        <Button
          component={Link}
          to={ROUTES.LOGIN}
          size="large"
          startIcon={<Login />}
        >
          Back to sign in
        </Button>
      </Stack>
    </AuthPage>
  )
}
