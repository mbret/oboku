import { Button, Stack } from "@mui/material"
import { useForm } from "react-hook-form"
import { ControlledTextField } from "../common/forms/ControlledTextField"
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
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        gap: 1,
      }}
    >
      <ControlledTextField
        name="password"
        control={control}
        rules={{ required: true, minLength: 8 }}
        label="Password"
        type="password"
        fullWidth
        autoComplete="new-password"
      />
      <ControlledTextField
        name="confirmPassword"
        control={control}
        rules={{
          required: true,
          validate: (value) =>
            value === getValues("password") || "Passwords must match",
        }}
        label="Confirm password"
        type="password"
        fullWidth
        autoComplete="new-password"
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
