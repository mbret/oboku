import { Alert, Box, Button, Stack } from "@mui/material"
import { Login } from "@mui/icons-material"
import { Link, useSearchParams } from "react-router"
import { AuthPage } from "../auth/AuthPage"
import { useCompleteMagicLink } from "../auth/useCompleteMagicLink"
import { isCancelError } from "../errors/errors.shared"
import { ErrorAlert } from "../errors/ErrorMessage"
import { ROUTES } from "../navigation/routes"
import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { CompleteAuthenticationGate } from "../auth/CompleteAuthenticationGate"

export const MagicLinkCompleteScreen = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const { mutate, error, isPending, status } = useCompleteMagicLink()

  return (
    <CompleteAuthenticationGate completionStatus={status}>
      <AuthPage>
        {!token ? (
          <Box
            sx={{
              mb: 2,
            }}
          >
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
          <Box
            sx={{
              mb: 2,
            }}
          >
            <ErrorAlert error={error} />
          </Box>
        ) : null}
        {token && !error ? (
          <Box
            sx={{
              mb: 2,
            }}
          >
            <Alert severity="info">
              {isPending
                ? "Verifying your email and signing you in..."
                : "Continue to verify your email and sign in."}
            </Alert>
          </Box>
        ) : null}
        <Stack
          sx={{
            gap: 1,
            mt: 3,
          }}
        >
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
    </CompleteAuthenticationGate>
  )
}
