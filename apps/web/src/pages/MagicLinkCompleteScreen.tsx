import { Alert, Box, Button, Stack } from "@mui/material"
import { Login } from "@mui/icons-material"
import { Link, useSearchParams } from "react-router"
import { useEffect } from "react"
import { AuthPage } from "../auth/AuthPage"
import { useCompleteMagicLink } from "../auth/useCompleteMagicLink"
import { isCancelError } from "../errors/errors.shared"
import { ErrorAlert } from "../errors/ErrorMessage"
import { ROUTES } from "../navigation/routes"
import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"

export const MagicLinkCompleteScreen = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const { mutate, error, isPending } = useCompleteMagicLink()

  useEffect(() => {
    if (!token) {
      return
    }

    mutate({ token })
  }, [mutate, token])

  return (
    <AuthPage>
      {!token ? (
        <Box mb={2}>
          <ErrorAlert
            error={
              new ObokuSharedError(
                ObokuErrorCode.ERROR_MAGIC_LINK_MISSING_TOKEN,
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
      {token && !error ? (
        <Box mb={2}>
          <Alert severity="info">
            {isPending
              ? "Verifying your email and signing you in..."
              : "Magic link accepted."}
          </Alert>
        </Box>
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
