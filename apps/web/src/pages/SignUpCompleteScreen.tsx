import { Alert, Box, Button, Stack } from "@mui/material"
import { Login } from "@mui/icons-material"
import { Link, useSearchParams } from "react-router"
import { AuthPage } from "../auth/AuthPage"
import { CompleteSignUpForm } from "../auth/CompleteSignUpForm"
import { useCompleteSignUp } from "../auth/useCompleteSignUp"
import { isCancelError } from "../errors/errors.shared"
import { ErrorMessage } from "../errors/ErrorMessage"
import { ROUTES } from "../navigation/routes"

export const SignUpCompleteScreen = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const { mutate, error } = useCompleteSignUp()

  return (
    <AuthPage>
      {!token ? (
        <Box mb={2}>
          <Alert severity="warning">
            This sign up link is missing a token. Please request a new one.
          </Alert>
        </Box>
      ) : null}
      {error && !isCancelError(error) ? (
        <Box mb={2}>
          <Alert severity="warning">
            <ErrorMessage error={error} />
          </Alert>
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
