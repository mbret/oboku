import {
  Alert,
  Button,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material"
import { Trans, useLingui } from "@lingui/react/macro"
import {
  formatBytes,
  isKindleEmail,
  type SendToKindleConfigDto,
} from "@oboku/shared"
import { useForm } from "react-hook-form"
import { Page } from "../../common/Page"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"
import { showConfirmDialog } from "../../common/dialogs/presets"
import { ControlledTextField } from "../../common/forms/ControlledTextField"
import { TextField } from "../../common/forms/TextField"
import { useConfig } from "../../config/useConfig"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { useSettings } from "../../settings/useSettings"
import { useSetKindleEmail } from "./useSetKindleEmail"

type KindleAddressFormValues = {
  kindleEmail: string
}

function KindleAddressForm({ savedKindleEmail }: { savedKindleEmail: string }) {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { t } = useLingui()
  const { mutate: saveKindleEmail, isPending } = useSetKindleEmail()
  const {
    control,
    handleSubmit,
    formState: { isValid, isDirty },
  } = useForm<KindleAddressFormValues>({
    mode: "onChange",
    defaultValues: { kindleEmail: savedKindleEmail },
  })

  return (
    <form
      onSubmit={handleSubmit(function saveFormAddress({ kindleEmail }) {
        saveKindleEmail(kindleEmail.trim())
      })}
    >
      <PageSection title={t`2. Save your Kindle address`} variant="stack">
        <Typography variant="body2" color="textSecondary">
          <Trans>
            The same Amazon page shows the address of each Kindle, under
            "Send-to-Kindle E-Mail Settings".
          </Trans>
        </Typography>
        <ControlledTextField
          control={control}
          name="kindleEmail"
          label={t`Send to Kindle address`}
          placeholder="name@kindle.com"
          type="email"
          autoComplete="off"
          fullWidth
          rules={{
            required: true,
            validate: function validateKindleEmail(value) {
              return (
                isKindleEmail(value.trim()) ||
                t`Enter an address that ends with @kindle.com`
              )
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          loading={isPending}
          disabled={!isValid || !isDirty}
        >
          <Trans>Save</Trans>
        </Button>
      </PageSection>
    </form>
  )
}

function SendToKindleSetup({
  sendToKindle,
  savedKindleEmail,
}: {
  sendToKindle: SendToKindleConfigDto
  savedKindleEmail: string
}) {
  const { t } = useLingui()
  const { mutate: saveKindleEmail } = useSetKindleEmail()
  const maxFileSize = formatBytes(sendToKindle.maxFileSizeBytes)
  const { maxSendsPerDay } = sendToKindle

  const confirmThenRemoveAddress = async () => {
    const confirmed = await showConfirmDialog({
      title: t`Remove your Kindle address?`,
      message: t`oboku stops sending books to this Kindle. The address stays approved in your Amazon account.`,
      actions: [{ title: t`Remove` }],
    })

    if (!confirmed) return

    saveKindleEmail(null)
  }

  return (
    <>
      <PageContainer>
        <Stack spacing={2} sx={{ pt: 2 }}>
          <Typography>
            <Trans>
              oboku can email a book of your library to your Kindle. oboku's
              server reads the book from its source, then sends it with Amazon's
              Send to Kindle.
            </Trans>
          </Typography>
        </Stack>
      </PageContainer>
      <PageContainer disableGutters>
        <PageSection
          title={t`1. Approve oboku in your Amazon account`}
          variant="stack"
        >
          <Typography variant="body2" color="textSecondary">
            <Trans>
              On Amazon's website, open "Manage Your Content and Devices", then
              "Preferences", then "Personal Document Settings". Add this address
              to the "Approved Personal Document E-mail List". Amazon ignores
              the emails of any other sender.
            </Trans>
          </Typography>
          <TextField
            label={t`Address to approve`}
            value={sendToKindle.senderAddress}
            copyable
            fullWidth
            slotProps={{ input: { readOnly: true } }}
          />
        </PageSection>
        <KindleAddressForm
          key={savedKindleEmail}
          savedKindleEmail={savedKindleEmail}
        />
        <PageSection title={t`3. Send a book`}>
          <ListItem>
            <ListItemText
              primary={t`Open the actions of a book, then tap "Send to Kindle".`}
              secondary={t`oboku tells you when the email left. Amazon then delivers the book, most often in a few minutes. If a book does not arrive, check that the address above is approved.`}
            />
          </ListItem>
        </PageSection>
        <PageSection title={t`Limits`}>
          <ListItem>
            <ListItemText
              primary={t`EPUB, PDF and text files`}
              secondary={t`Amazon accepts no comic archive by email, and oboku converts nothing.`}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t`Up to ${maxFileSize} for a book`}
              secondary={t`The file goes through oboku's server, so it counts on your download quota.`}
            />
          </ListItem>
          <ListItem>
            <ListItemText primary={t`${maxSendsPerDay} books a day`} />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t`Not for a book added from a device`}
              secondary={t`oboku's server cannot reach a file that is only on your device.`}
            />
          </ListItem>
        </PageSection>
        {!!savedKindleEmail && (
          <PageSection title={t`Danger zone`} tone="danger">
            <ListItemButton onClick={confirmThenRemoveAddress}>
              <ListItemText
                primary={t`Remove your Kindle address`}
                secondary={t`oboku stops sending books to this Kindle`}
              />
            </ListItemButton>
          </PageSection>
        )}
      </PageContainer>
    </>
  )
}

export function SendToKindleScreen() {
  const { t } = useLingui()
  const { data: config } = useConfig()
  const { data: settings } = useSettings()
  const sendToKindle = config?.SEND_TO_KINDLE
  const areSettingsLoaded = settings !== undefined

  return (
    <Page>
      <TopBarNavigation title={t`Send to Kindle`} />
      {!!config && !sendToKindle && (
        <PageContainer>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Trans>
              This oboku server is not set up to send emails, so it cannot send
              a book to a Kindle.
            </Trans>
          </Alert>
        </PageContainer>
      )}
      {!!sendToKindle && areSettingsLoaded && (
        <SendToKindleSetup
          sendToKindle={sendToKindle}
          savedKindleEmail={settings?.kindleEmail ?? ""}
        />
      )}
    </Page>
  )
}
