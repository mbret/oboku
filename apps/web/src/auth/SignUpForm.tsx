import { Button, Stack } from "@mui/material"
import { useForm } from "react-hook-form"
import { ControlledTextField } from "../common/forms/ControlledTextField"
import { PersonAdd } from "@mui/icons-material"

type Inputs = {
  email: string
}

export const SignUpForm = ({
  onSubmit,
}: {
  onSubmit: (data: Inputs) => void
}) => {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

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
      <ControlledTextField
        name="email"
        control={control}
        rules={{
          required: true,
          pattern: {
            value: /\S+@\S+\.\S+/,
            message: "Invalid email format",
          },
        }}
        label="Email"
        type="email"
        fullWidth
        autoComplete="email"
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
