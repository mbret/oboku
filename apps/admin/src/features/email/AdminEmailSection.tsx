import {
  Button,
  Group,
  Paper,
  Radio,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { useSendAdminEmail } from "./useSendAdminEmail"

type AdminEmailFormValues = {
  subject: string
  body: string
  audienceType: "all" | "emails"
  recipientEmails: string
}

const parseEmails = (value: string) =>
  value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

export const AdminEmailSection = () => {
  const form = useForm<AdminEmailFormValues>({
    mode: "controlled",
    initialValues: {
      subject: "",
      body: "",
      audienceType: "all",
      recipientEmails: "",
    },
    validate: {
      subject: (value) =>
        value.trim().length > 0 ? null : "Subject is required",
      body: (value) => (value.trim().length > 0 ? null : "Body is required"),
      recipientEmails: (value, values) =>
        values.audienceType === "emails" && parseEmails(value).length === 0
          ? "Provide at least one email"
          : null,
    },
  })
  const sendEmail = useSendAdminEmail()

  return (
    <Stack gap="md">
      <div>
        <Title order={3} mb="xs">
          Emails
        </Title>
        <Text size="sm" c="dimmed">
          Send an email to every user or to a specific set of email addresses.
        </Text>
      </div>

      <Paper withBorder p="md">
        <Stack gap="sm">
          <div>
            <Text size="sm" fw={500} mb="xs">
              Compose
            </Text>
            <Text size="sm" c="dimmed">
              Write the email recipients will receive in their inbox.
            </Text>
          </div>

          <form
            onSubmit={form.onSubmit((values) => {
              sendEmail.mutate(
                {
                  subject: values.subject,
                  body: values.body,
                  audienceType: values.audienceType,
                  emails:
                    values.audienceType === "emails"
                      ? parseEmails(values.recipientEmails)
                      : undefined,
                },
                {
                  onSuccess: () => {
                    form.reset()
                  },
                },
              )
            })}
          >
            <Stack gap="sm">
              <TextInput
                label="Subject"
                placeholder="Important update about Oboku"
                {...form.getInputProps("subject")}
              />
              <Textarea
                label="Body"
                placeholder="Write your message here."
                minRows={6}
                autosize
                {...form.getInputProps("body")}
              />
              <Radio.Group
                label="Audience"
                {...form.getInputProps("audienceType")}
              >
                <Stack gap="xs" mt="xs">
                  <Radio
                    value="all"
                    label="Everyone"
                    description="Send the email to all existing users."
                  />
                  <Radio
                    value="emails"
                    label="Specific emails"
                    description="Only send to the provided email addresses."
                  />
                </Stack>
              </Radio.Group>
              {form.values.audienceType === "emails" && (
                <Textarea
                  label="Recipient emails"
                  description="Separate addresses with commas or new lines."
                  placeholder={"reader@example.com\nteam@example.com"}
                  minRows={4}
                  autosize
                  {...form.getInputProps("recipientEmails")}
                />
              )}
              <Group justify="flex-end">
                <Button type="submit" loading={sendEmail.isPending}>
                  send email
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Stack>
  )
}
