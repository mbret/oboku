import { Box, Button, Stack } from "@mui/material"
import { Login } from "@mui/icons-material"
import { Link, Navigate, useSearchParams } from "react-router"
import { AuthPage } from "../auth/AuthPage"
import { CompleteSignUpForm } from "../auth/CompleteSignUpForm"
import { useCompleteSignUp } from "../auth/useCompleteSignUp"
import { isCancelError } from "../errors/errors.shared"
import { ErrorAlert } from "../errors/ErrorMessage"
import { ROUTES } from "../navigation/routes"
import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { useSignalValue } from "reactjrx"
import { authStateSignal } from "../auth/states.web"
import { SignOutBeforeContinuePage } from "../auth/SignOutBeforeContinuePage"

export const SignUpCompleteScreen = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const auth = useSignalValue(authStateSignal)
  const isAuthenticated = !!auth?.accessToken
  const { mutateAsync, error, status } = useCompleteSignUp()

  if (status === "success" && isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  if (isAuthenticated) {
    return <SignOutBeforeContinuePage />
  }

  return (
    <AuthPage>
      {!token ? (
        <Box mb={2}>
          <ErrorAlert
            error={
              new ObokuSharedError(
                ObokuErrorCode.ERROR_SIGNUP_LINK_MISSING_TOKEN,
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
          onSubmit={async (data) => {
            await mutateAsync({
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
