import { Button, Stack, TextField } from "@mui/material"
import { Controller, useForm } from "react-hook-form"
import { errorToHelperText } from "../common/forms/errorToHelperText"
import { PersonAdd } from "@mui/icons-material"

type Inputs = {
  email: string
}

export const SignUpForm = ({
  onSubmit,
}: {
  onSubmit: (data: Inputs) => void
}) => {
  const { control, handleSubmit } = useForm<Inputs>({
    defaultValues: {
      email: "",
    },
  })

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        gap: 1,
      }}
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
      <Button
        type="submit"
        size="large"
        variant="contained"
        startIcon={<PersonAdd />}
      >
        Send sign up link
      </Button>
    </Stack>
  )
}
