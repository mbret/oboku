import { Button, Box, Stack } from "@mui/material"
import { Alert } from "@mui/material"
import { Login } from "@mui/icons-material"
import { OrDivider } from "../common/OrDivider"
import { isCancelError } from "../errors/errors.shared"
import { ErrorMessage } from "../errors/ErrorMessage"
import { Link } from "react-router"
import { ROUTES } from "../navigation/routes"
import { SignUpForm } from "../auth/SignUpForm"
import { AuthPage } from "../auth/AuthPage"
import { useSignUp } from "../auth/useSignUp"

export const SignUpScreen = () => {
  const { mutate, error } = useSignUp()

  return (
    <AuthPage>
      {error && !isCancelError(error) ? (
        <Box mb={2}>
          <Alert severity="warning">
            <ErrorMessage error={error} />
          </Alert>
        </Box>
      ) : null}
      <SignUpForm onSubmit={mutate} />
      <OrDivider title="or" />
      <Stack gap={1}>
        <Button
          component={Link}
          to={ROUTES.LOGIN}
          size="large"
          startIcon={<Login />}
        >
          Sign in
        </Button>
      </Stack>
    </AuthPage>
  )
}
