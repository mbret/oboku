import { Button, Stack } from "@mui/material"
import type { Control, UseFormHandleSubmit } from "react-hook-form"
import { ControlledTextField } from "../common/forms/ControlledTextField"
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
      <ControlledTextField
        name="email"
        control={control}
        rules={{ required: true }}
        label="Email"
        type="email"
        fullWidth
        autoComplete="email"
      />
      <ControlledTextField
        name="password"
        control={control}
        rules={{ required: true }}
        label="Password"
        type="password"
        fullWidth
        autoComplete="current-password"
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
