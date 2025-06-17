import { Button, Stack, TextField } from "@mui/material"
import { Controller, useForm } from "react-hook-form"
import { errorToHelperText } from "../common/forms/errorToHelperText"
import { Login } from "@mui/icons-material"

type Inputs = {
  email: string
  password: string
}

export const SignInForm = ({
  onSubmit,
}: {
  onSubmit: (data: Inputs) => void
}) => {
  const { control, handleSubmit } = useForm<Inputs>({
    defaultValues: {
      email: "",
      password: "",
    },
  })

  return (
    <Stack
      component="form"
      noValidate
      gap={1}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Controller
        name="email"
        control={control}
        rules={{ required: true }}
        render={({ field: { ref, ...rest }, fieldState }) => {
          return (
            <TextField
              {...rest}
              label="Email"
              type="email"
              fullWidth
              inputRef={ref}
              autoComplete="email"
              error={fieldState.invalid}
              helperText={errorToHelperText(fieldState.error)}
            />
          )
        }}
      />
      <Controller
        name="password"
        control={control}
        rules={{ required: true }}
        render={({ field: { ref, ...rest }, fieldState }) => {
          return (
            <TextField
              {...rest}
              label="Password"
              type="password"
              fullWidth
              inputRef={ref}
              autoComplete="current-password"
              error={fieldState.invalid}
              helperText={errorToHelperText(fieldState.error)}
            />
          )
        }}
      />
      <Button
        type="submit"
        size="large"
        variant="contained"
        startIcon={<Login />}
      >
        Sign in
      </Button>
    </Stack>
  )
}
