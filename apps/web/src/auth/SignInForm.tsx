import { Button, Stack, TextField } from "@mui/material"
import {
  Controller,
  type Control,
  type UseFormHandleSubmit,
} from "react-hook-form"
import { errorToHelperText } from "../common/forms/errorToHelperText"
import { Login } from "@mui/icons-material"

export type SignInFormInputs = {
  email: string
  password: string
}

export const SignInForm = ({
  control,
  onSubmit,
  disabled,
}: {
  control: Control<SignInFormInputs>
  onSubmit: ReturnType<UseFormHandleSubmit<SignInFormInputs>>
  disabled?: boolean
}) => {
  return (
    <Stack
      component="form"
      noValidate
      onSubmit={onSubmit}
      sx={{
        gap: 1,
      }}
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
        disabled={disabled}
      >
        Sign in
      </Button>
    </Stack>
  )
}
