import {
  Button,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { renderBroadcastEmail } from "@oboku/shared"
import { Link } from "@tanstack/react-router"
import {
  AudienceFields,
  type AudienceFormValues,
  parseEmails,
  validateRecipientEmails,
} from "@/components/AudienceFields"
import { ConfirmModal, useConfirmableSubmit } from "@/components/ConfirmModal"
import { EmailFrame } from "./EmailFrame"
import { useSendAdminEmail } from "./useSendAdminEmail"

type AdminEmailFormValues = AudienceFormValues & {
  subject: string
  body: string
}

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
      recipientEmails: validateRecipientEmails,
    },
  })
  const sendEmail = useSendAdminEmail()
  const confirmation = useConfirmableSubmit<AdminEmailFormValues>()
  const { pendingValues } = confirmation

  const audienceSummary = pendingValues
    ? pendingValues.audienceType === "all"
      ? "every user"
      : `${parseEmails(pendingValues.recipientEmails).length} recipient(s)`
    : ""

  const handleConfirmSend = () => {
    if (!pendingValues) return

    sendEmail.mutate(
      {
        subject: pendingValues.subject,
        body: pendingValues.body,
        audienceType: pendingValues.audienceType,
        emails:
          pendingValues.audienceType === "emails"
            ? parseEmails(pendingValues.recipientEmails)
            : undefined,
      },
      {
        onSuccess: () => {
          form.reset()
          confirmation.reset()
        },
      },
    )
  }

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
        <form onSubmit={form.onSubmit(confirmation.request)}>
          <Stack gap="sm">
            <Tabs defaultValue="compose">
              <Tabs.List mb="md">
                <Tabs.Tab value="compose">Compose</Tabs.Tab>
                <Tabs.Tab value="preview" disabled={!form.values.body.trim()}>
                  Preview
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="compose">
                <Stack gap="sm">
                  <Text size="sm" c="dimmed">
                    Write the email recipients will receive in their inbox.
                  </Text>
                  <TextInput
                    label="Subject"
                    placeholder="Important update about oboku"
                    {...form.getInputProps("subject")}
                  />
                  <Textarea
                    label="Body"
                    placeholder="Write your message here."
                    minRows={6}
                    autosize
                    {...form.getInputProps("body")}
                  />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="preview">
                <EmailPreview
                  subject={form.values.subject}
                  body={form.values.body}
                />
              </Tabs.Panel>
            </Tabs>

            <AudienceFields
              form={form}
              groupLabel="Audience"
              everyoneLabel="Everyone"
              everyoneDescription="Send the email to all existing users."
              specificLabel="Specific emails"
              specificDescription="Only send to the provided email addresses."
              emailsLabel="Recipient emails"
            />
            <Group justify="flex-end">
              <Button type="submit">send email</Button>
            </Group>
          </Stack>
        </form>
      </Paper>

      <ConfirmModal
        opened={confirmation.opened}
        onClose={confirmation.close}
        title="Send this broadcast?"
        confirmLabel={`Send to ${audienceSummary}`}
        onConfirm={handleConfirmSend}
        pending={sendEmail.isPending}
      >
        <Text size="sm">
          You're about to email <strong>{audienceSummary}</strong>. This action
          can't be undone.
        </Text>
        {pendingValues && (
          <Text size="sm" c="dimmed">
            Subject: {pendingValues.subject.trim() || "(no subject)"}
          </Text>
        )}
      </ConfirmModal>

      <Paper withBorder p="md">
        <Group justify="space-between" align="center" wrap="nowrap">
          <div>
            <Text size="sm" fw={500}>
              Email templates
            </Text>
            <Text size="sm" c="dimmed">
              Preview every email oboku sends, rendered with mock data.
            </Text>
          </div>
          <Button component={Link} to="/email/templates" variant="light">
            View templates
          </Button>
        </Group>
      </Paper>
    </Stack>
  )
}

const EmailPreview = ({ subject, body }: { subject: string; body: string }) => {
  const html = renderBroadcastEmail({ body })

  return (
    <Stack gap="xs">
      <Text size="sm" c="dimmed">
        This is how the email will look in the recipient's inbox.
      </Text>
      <div>
        <Text size="xs" c="dimmed">
          Subject
        </Text>
        <Text size="sm" fw={500}>
          {subject.trim() || "(no subject)"}
        </Text>
      </div>
      <EmailFrame html={html} />
    </Stack>
  )
}
