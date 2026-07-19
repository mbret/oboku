import { Paper, Stack, Text, Title } from "@mantine/core"
import {
  links,
  renderBroadcastEmail,
  renderMagicLinkEmail,
  renderSignUpEmail,
} from "@oboku/shared"
import { EmailFrame } from "./EmailFrame"

const MOCK_TOKEN = "mock-token-0123456789abcdef"

const MOCK_BROADCAST_BODY = `Hi there,

We've just shipped a fresh batch of improvements to oboku, including faster sync and a redesigned reader.

Thanks for being part of the community!`

const templates = [
  {
    id: "signup",
    name: "Sign up",
    description: "Sent when a user completes their sign up.",
    html: renderSignUpEmail({
      url: `${links.app}/signup/complete?token=${MOCK_TOKEN}`,
    }),
  },
  {
    id: "magic-link",
    name: "Magic link",
    description: "One-time link to verify an email and sign in.",
    html: renderMagicLinkEmail({
      url: `${links.app}/login/magic-link?token=${MOCK_TOKEN}`,
    }),
  },
  {
    id: "broadcast",
    name: "Broadcast",
    description: "Admin email sent to users, shown here with mock content.",
    html: renderBroadcastEmail({ body: MOCK_BROADCAST_BODY }),
  },
] as const

export const EmailTemplatesSection = () => {
  return (
    <Stack gap="md">
      <div>
        <Title order={3} mb="xs">
          Email templates
        </Title>
        <Text size="sm" c="dimmed">
          Preview every email oboku sends, rendered with mock data.
        </Text>
      </div>

      {templates.map((template) => (
        <Paper key={template.id} withBorder p="md">
          <Stack gap="xs">
            <div>
              <Text size="sm" fw={600}>
                {template.name}
              </Text>
              <Text size="sm" c="dimmed">
                {template.description}
              </Text>
            </div>
            <EmailFrame html={template.html} title={`${template.name} email`} />
          </Stack>
        </Paper>
      ))}
    </Stack>
  )
}
