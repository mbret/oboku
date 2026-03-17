import { Home } from "@mui/icons-material"
import { Alert, Button, Stack } from "@mui/material"
import { ROUTES } from "src/navigation/routes"
import { AuthPage } from "./AuthPage"
import { Link } from "react-router"

export const SignOutBeforeContinuePage = () => {
  return (
    <AuthPage>
      <Stack gap={2}>
        <Alert severity="warning">
          You are already signed in. Sign out first if you want to continue.
        </Alert>
        <Button
          component={Link}
          to={ROUTES.HOME}
          size="large"
          startIcon={<Home />}
        >
          Home
        </Button>
      </Stack>
    </AuthPage>
  )
}
