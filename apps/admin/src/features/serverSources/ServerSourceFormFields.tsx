import { Switch, TextInput } from "@mantine/core"
import { useForm, type UseFormReturnType } from "@mantine/form"

interface ServerSourceFormValues {
  name: string
  path: string
  enabled: boolean
}

export const useServerSourceForm = (
  initialValues?: Partial<ServerSourceFormValues>,
) =>
  useForm<ServerSourceFormValues>({
    mode: "uncontrolled",
    initialValues: {
      name: "",
      path: "",
      enabled: true,
      ...initialValues,
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : "Name is required"),
      path: (value) =>
        value.trim().length > 0 ? null : "Absolute container path is required",
    },
  })

export const ServerSourceFormFields = ({
  form,
}: {
  form: UseFormReturnType<ServerSourceFormValues>
}) => (
  <>
    <TextInput
      label="Display name"
      placeholder="Main library"
      key={form.key("name")}
      {...form.getInputProps("name")}
    />
    <TextInput
      label="Container path"
      description="Absolute directory path as seen by the API process inside the container"
      placeholder="/library/books"
      key={form.key("path")}
      {...form.getInputProps("path")}
    />
    <Switch
      label="Enabled"
      key={form.key("enabled")}
      {...form.getInputProps("enabled", { type: "checkbox" })}
    />
  </>
)

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error"
