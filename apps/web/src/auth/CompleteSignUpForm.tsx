import { Button, Stack, TextField } from "@mui/material"
import { Controller, useForm } from "react-hook-form"
import { errorToHelperText } from "../common/forms/errorToHelperText"
import { PersonAdd } from "@mui/icons-material"

type Inputs = {
  password: string
  confirmPassword: string
}

export const CompleteSignUpForm = ({
  onSubmit,
}: {
  onSubmit: (data: Inputs) => void
}) => {
  const { control, handleSubmit, getValues } = useForm<Inputs>({
    defaultValues: {
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
          validate: (value) =>
            value === getValues("password") || "Passwords must match",
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
        Complete sign up
      </Button>
    </Stack>
  )
}
