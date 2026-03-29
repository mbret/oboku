import { Alert, Box, Button, Stack } from "@mui/material"
import { Login } from "@mui/icons-material"
import { Link, Navigate, useSearchParams } from "react-router"
import { AuthPage } from "../auth/AuthPage"
import { useCompleteMagicLink } from "../auth/useCompleteMagicLink"
import { isCancelError } from "../errors/errors.shared"
import { ErrorAlert } from "../errors/ErrorMessage"
import { ROUTES } from "../navigation/routes"
import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { useSignalValue } from "reactjrx"
import { authStateSignal } from "../auth/states.web"
import { SignOutBeforeContinuePage } from "../auth/SignOutBeforeContinuePage"

export const MagicLinkCompleteScreen = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const auth = useSignalValue(authStateSignal)
  const isAuthenticated = !!auth?.accessToken
  const { mutate, error, isPending, status } = useCompleteMagicLink()

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
                ObokuErrorCode.ERROR_MAGIC_LINK_MISSING_TOKEN,
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
      {token && !error ? (
        <Box mb={2}>
          <Alert severity="info">
            {isPending
              ? "Verifying your email and signing you in..."
              : "Continue to verify your email and sign in."}
          </Alert>
        </Box>
      ) : null}
      <Stack gap={1} mt={3}>
        {token ? (
          <Button
            variant="contained"
            size="large"
            disabled={isPending}
            onClick={() => {
              mutate({ token })
            }}
          >
            Continue with magic link
          </Button>
        ) : null}
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
