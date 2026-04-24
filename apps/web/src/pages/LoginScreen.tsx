import { Alert, Button, Box, Stack } from "@mui/material"
import { Google, PersonAdd, MarkEmailRead } from "@mui/icons-material"
import { useSignIn } from "../auth/useSignIn"
import { OrDivider } from "../common/OrDivider"
import { isApiError, isCancelError } from "../errors/errors.shared"
import { configuration } from "../config/configuration"
import { SignInForm, type SignInFormInputs } from "../auth/SignInForm"
import { Link } from "react-router"
import { ROUTES } from "../navigation/routes"
import { AuthPage } from "../auth/AuthPage"
import { ErrorAlert } from "../errors/ErrorMessage"
import { ObokuErrorCode } from "@oboku/shared"
import { useRequestMagicLink } from "../auth/useRequestMagicLink"
import { useForm } from "react-hook-form"

export const LoginScreen = () => {
  const { mutate, isPending, error } = useSignIn()
  const {
    mutate: requestMagicLink,
    error: requestMagicLinkError,
    status: requestMagicLinkStatus,
    isPending: isRequestMagicLinkPending,
  } = useRequestMagicLink()
  const { control, handleSubmit, watch } = useForm<SignInFormInputs>({
    defaultValues: {
      email: "",
      password: "",
    },
  })
  const email = watch("email")
  const canRequestMagicLink =
    !!email &&
    isApiError(error) &&
    error.response?.data.errors[0]?.code ===
      ObokuErrorCode.ERROR_SIGNIN_EMAIL_NO_VERIFIED
  const displayedError =
    requestMagicLinkStatus === "success"
      ? null
      : requestMagicLinkError && !isCancelError(requestMagicLinkError)
        ? requestMagicLinkError
        : error && !isCancelError(error)
          ? error
          : null

  return (
    <AuthPage>
      {displayedError ? (
        <Box
          sx={{
            mb: 2,
          }}
        >
          <ErrorAlert error={displayedError} />
        </Box>
      ) : null}
      {requestMagicLinkStatus === "success" ? (
        <Box
          sx={{
            mb: 2,
          }}
        >
          <Alert severity="success">
            Check your inbox for a magic link to verify this account and sign
            in.
          </Alert>
        </Box>
      ) : null}
      <Stack
        sx={{
          gap: 1,
        }}
      >
        <SignInForm
          control={control}
          onSubmit={handleSubmit((data) => {
            mutate(data)
          })}
        />
        {canRequestMagicLink ? (
          <Button
            onClick={() => {
              requestMagicLink({
                email,
              })
            }}
            size="large"
            startIcon={<MarkEmailRead />}
            disabled={isPending || isRequestMagicLinkPending}
          >
            Email me a magic link
          </Button>
        ) : null}
        <Button variant="text" disabled>
          I forgot my password
        </Button>
      </Stack>
      <OrDivider title="or" />
      <Stack
        sx={{
          gap: 1,
        }}
      >
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
      </Stack>
    </AuthPage>
  )
}
