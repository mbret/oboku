import { Button, Stack, TextField } from "@mui/material"
import { Controller, useForm } from "react-hook-form"
import { errorToHelperText } from "../common/forms/errorToHelperText"
import { PersonAdd } from "@mui/icons-material"

type Inputs = {
  email: string
  password: string
  confirmPassword: string
}

export const SignUpForm = ({
  onSubmit,
}: { onSubmit: (data: Inputs) => void }) => {
  const { control, handleSubmit, getValues } = useForm<Inputs>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
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
        rules={{
          required: true,
          pattern: {
            value: /\S+@\S+\.\S+/,
            message: "Invalid email format",
          },
        }}
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
        rules={{ required: true, minLength: 8 }}
        render={({ field: { ref, ...rest }, fieldState }) => {
          return (
            <TextField
              {...rest}
              label="Password"
              type="password"
              fullWidth
              inputRef={ref}
              autoComplete="new-password"
              error={fieldState.invalid}
              helperText={errorToHelperText(fieldState.error)}
            />
          )
        }}
      />
      <Controller
        name="confirmPassword"
        control={control}
        rules={{
          required: true,
          validate: (value) => value === getValues("password"),
        }}
        render={({ field: { ref, ...rest }, fieldState }) => {
          return (
            <TextField
              {...rest}
              label="Confirm password"
              type="password"
              fullWidth
              inputRef={ref}
              autoComplete="new-password"
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
        startIcon={<PersonAdd />}
      >
        Sign up
      </Button>
    </Stack>
  )
}
