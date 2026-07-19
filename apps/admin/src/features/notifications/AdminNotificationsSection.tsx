import type { NotificationSeverity } from "@oboku/shared"
import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import {
  AudienceFields,
  type AudienceFormValues,
  parseEmails,
  validateRecipientEmails,
} from "@/components/AudienceFields"
import { useCreateAdminNotification } from "./useCreateAdminNotification"
import { useAdminNotifications } from "./useAdminNotifications"

type AdminNotificationsFormValues = AudienceFormValues & {
  title: string
  body: string
  severity: NotificationSeverity
}

const severityOptions: {
  value: NotificationSeverity
  label: string
}[] = [
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
]

const severityColorMap: Record<NotificationSeverity, string> = {
  info: "blue",
  success: "green",
  warning: "yellow",
  error: "red",
}

export const AdminNotificationsSection = () => {
  const form = useForm<AdminNotificationsFormValues>({
    mode: "controlled",
    initialValues: {
      title: "",
      body: "",
      severity: "info",
      audienceType: "all",
      recipientEmails: "",
    },
    validate: {
      title: (value) => (value.trim().length > 0 ? null : "Title is required"),
      recipientEmails: validateRecipientEmails,
    },
  })
  const notificationsQuery = useAdminNotifications()
  const createNotification = useCreateAdminNotification()

  return (
    <Stack gap="md">
      <div>
        <Title order={3} mb="xs">
          Notifications
        </Title>
        <Text size="sm" c="dimmed">
          Send an inbox notification to every user or to a specific set of email
          addresses. Only existing users will receive the notification.
        </Text>
      </div>

      <Paper withBorder p="md">
        <Stack gap="sm">
          <div>
            <Text size="sm" fw={500} mb="xs">
              Broadcast
            </Text>
            <Text size="sm" c="dimmed">
              Compose the notification users will see in their inbox.
            </Text>
          </div>

          <form
            onSubmit={form.onSubmit(async (values) => {
              await createNotification.mutateAsync({
                title: values.title,
                body: values.body || undefined,
                severity: values.severity,
                audienceType: values.audienceType,
                emails:
                  values.audienceType === "emails"
                    ? parseEmails(values.recipientEmails)
                    : undefined,
              })

              form.reset()
            })}
          >
            <Stack gap="sm">
              <TextInput
                label="Title"
                placeholder="Sync maintenance tonight"
                {...form.getInputProps("title")}
              />
              <Textarea
                label="Body"
                placeholder="We will restart the sync worker at 22:00 UTC."
                minRows={4}
                autosize
                {...form.getInputProps("body")}
              />
              <Select
                label="Severity"
                data={severityOptions}
                allowDeselect={false}
                {...form.getInputProps("severity")}
              />
              <AudienceFields
                form={form}
                groupLabel="Audience"
                everyoneLabel="Everyone"
                everyoneDescription="Send the notification to all existing users."
                specificLabel="Specific emails"
                specificDescription="Only send to the provided email addresses."
                emailsLabel="Recipient emails"
              />
              <Group justify="flex-end">
                <Button type="submit" loading={createNotification.isPending}>
                  send notification
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="sm" fw={500} mb="xs">
                Recent notifications
              </Text>
              <Text size="sm" c="dimmed">
                Last 50 broadcast notifications sent from the admin panel.
              </Text>
            </div>
            <Button
              variant="light"
              onClick={() => notificationsQuery.refetch()}
              loading={notificationsQuery.isFetching}
            >
              refresh
            </Button>
          </Group>

          <ScrollArea.Autosize mah={500}>
            <Stack gap="sm">
              {notificationsQuery.isLoading && (
                <Text size="sm" c="dimmed">
                  Loading notifications…
                </Text>
              )}

              {notificationsQuery.error && (
                <Alert color="red" title="Could not load notifications">
                  {notificationsQuery.error.message}
                </Alert>
              )}

              {notificationsQuery.data?.length === 0 &&
                !notificationsQuery.isLoading && (
                  <Text size="sm" c="dimmed">
                    No notifications have been sent yet.
                  </Text>
                )}

              {notificationsQuery.data?.map((notification) => (
                <Paper withBorder p="sm" key={notification.id}>
                  <Stack gap="xs">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text size="sm" fw={500}>
                          {notification.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Text>
                      </div>
                      <Group gap="xs">
                        <Badge color={severityColorMap[notification.severity]}>
                          {notification.severity}
                        </Badge>
                        <Badge variant="light">
                          {notification.deliveredCount} recipients
                        </Badge>
                      </Group>
                    </Group>
                    {notification.body && (
                      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                        {notification.body}
                      </Text>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        </Stack>
      </Paper>
    </Stack>
  )
}
