import { memo, type ReactNode } from "react"
import {
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  styled,
  Typography,
} from "@mui/material"
import {
  type Control,
  Controller,
  type FieldPathByValue,
  useForm,
} from "react-hook-form"
import { useMutation$ } from "reactjrx"
import { from } from "rxjs"
import { ControlledSecretSelect } from "../common/forms/ControlledSecretSelect"
import { ControlledTextField } from "../common/forms/ControlledTextField"
import { notify } from "../notifications/toasts"
import {
  isHttpUrl,
  type SettingsConnectorDocType,
  type SettingsConnectorType,
} from "@oboku/shared"
import { TestConnection, type TestConnectionFn } from "./TestConnection"
import { useAddConnector } from "./useAddConnector"
import { useConnector } from "./useConnector"
import { isProxiedThroughServer } from "./connectorDetails"
import { useUpdateConnector } from "./useUpdateConnector"
import { ErrorAlert } from "../errors/ErrorMessage"
import { PageContainer } from "../common/PageContainer"
import { PageSection } from "../common/PageSection"

const FORM_ID = "connector-form"

const TopAlertStack = styled(Stack)(function styleTopAlertStack({ theme }) {
  return {
    marginTop: theme.spacing(2),
  }
})

const FormActionsStack = styled(Stack)(function styleFormActionsStack({
  theme,
}) {
  return {
    gap: theme.spacing(1),
    padding: theme.spacing(0, 2, 2),
  }
})

const CheckboxFieldStack = styled(Stack)(function styleCheckboxFieldStack({
  theme,
}) {
  return {
    gap: theme.spacing(0.5),
  }
})

const CaptionTypography = styled(Typography)(function styleCaptionTypography({
  theme,
}) {
  return {
    color: theme.palette.text.secondary,
  }
})

function getConnectorUrl(
  connector: SettingsConnectorDocType | undefined,
): string {
  return connector?.url ?? ""
}

const URL_PATTERN = {
  value: /^(https?:\/\/)?([\w-]+\.)*[\w-]+(:\d{1,5})?(\/[\w- ./?%&=]*)?$/,
  message: "Invalid URL",
}

const validateHttpScheme = (url: string) =>
  isHttpUrl(url) || "Enter the full address, starting with http:// or https://"

export type FormData = {
  urlValue: string
  username: string
  passwordAsSecretId: string
  allowSelfSigned: boolean
  proxyThroughServer: boolean
}

function ControlledCheckboxField({
  control,
  name,
  label,
  caption,
}: {
  control: Control<FormData>
  name: FieldPathByValue<FormData, boolean>
  label: string
  caption: string
}) {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  return (
    <Controller
      control={control}
      name={name}
      render={function renderCheckboxField({ field }) {
        return (
          <CheckboxFieldStack>
            <FormControlLabel
              control={
                <Checkbox checked={field.value} onChange={field.onChange} />
              }
              label={label}
            />
            <CaptionTypography variant="caption">{caption}</CaptionTypography>
          </CheckboxFieldStack>
        )
      }}
    />
  )
}

export type ConnectorFormConfig = {
  connectorType: SettingsConnectorType
  connectorId?: string
  onSubmitSuccess: () => void
  /** Rendered below the form's actions, in a `PageContainer` with `disableGutters`. */
  children?: ReactNode
  /** When false the URL field and "Allow self-signed certificate" checkbox are hidden. Defaults to true. */
  showUrl?: boolean
  /** Shows the "Use oboku's server as a proxy" checkbox with this caption, and saves its value. */
  proxyThroughServerCaption?: string
  urlHelperText?: ReactNode
  topAlert: ReactNode
  passwordFieldLabel?: string
  /** When provided, TestConnection is rendered; parent provides the async method to test the connection. */
  testConnection?: TestConnectionFn
  renderExtraActions?: () => ReactNode
}

export const ConnectorForm = memo(function ConnectorForm({
  connectorType,
  connectorId,
  onSubmitSuccess,
  children,
  showUrl = true,
  proxyThroughServerCaption,
  urlHelperText,
  topAlert,
  passwordFieldLabel = "Password secret",
  testConnection,
  renderExtraActions,
}: ConnectorFormConfig) {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { data: connector } = useConnector({
    id: connectorId,
    type: connectorType,
  })
  const isEditing = !!connectorId
  const isProxyThroughServerShown = proxyThroughServerCaption !== undefined
  const {
    control,
    formState: { isValid, disabled, errors },
    watch,
    handleSubmit,
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      urlValue: "",
      username: "",
      passwordAsSecretId: "",
      allowSelfSigned: false,
      proxyThroughServer: false,
    },
    values: {
      urlValue: getConnectorUrl(connector),
      username: connector?.username ?? "",
      passwordAsSecretId: connector?.passwordAsSecretId ?? "",
      allowSelfSigned: connector?.allowSelfSigned ?? false,
      proxyThroughServer: isProxiedThroughServer(connector),
    },
  })
  const data = watch()
  const { mutateAsync: addConnector } = useAddConnector({
    type: connectorType,
  })
  const { mutateAsync: updateConnector } = useUpdateConnector({
    type: connectorType,
  })
  const { mutate: submit } = useMutation$({
    mutationFn: (_formData: FormData) => {
      const payload = {
        username: data.username,
        passwordAsSecretId: data.passwordAsSecretId,
        ...(showUrl && {
          url: data.urlValue,
          allowSelfSigned: data.allowSelfSigned,
        }),
        ...(isProxyThroughServerShown && {
          proxyThroughServer: data.proxyThroughServer,
        }),
      }
      if (isEditing && connectorId) {
        return from(updateConnector({ id: connectorId, ...payload }))
      }
      return from(addConnector(payload))
    },
    onSuccess: () => {
      notify("actionSuccess")
      onSubmitSuccess()
    },
  })

  return (
    <>
      <PageContainer>
        <TopAlertStack>{topAlert}</TopAlertStack>
      </PageContainer>
      <PageContainer disableGutters>
        <form id={FORM_ID} onSubmit={handleSubmit((values) => submit(values))}>
          <PageSection variant="stack">
            {showUrl && (
              <ControlledTextField
                control={control}
                fullWidth
                label="URL"
                name="urlValue"
                helperText={urlHelperText}
                rules={{
                  required: true,
                  pattern: URL_PATTERN,
                  validate: validateHttpScheme,
                }}
              />
            )}
            <ControlledTextField
              control={control}
              fullWidth
              label="Username"
              name="username"
              rules={{ required: true }}
            />
            <ControlledSecretSelect
              control={control}
              fullWidth
              label={passwordFieldLabel}
              name="passwordAsSecretId"
              rules={{ required: true }}
            />
            {showUrl && (
              <ControlledCheckboxField
                control={control}
                name="allowSelfSigned"
                label="Allow self-signed certificate"
                caption="Used by API sync, metadata, and download requests. Browser connection tests may still require trusting the certificate in your browser."
              />
            )}
            {isProxyThroughServerShown && (
              <ControlledCheckboxField
                control={control}
                name="proxyThroughServer"
                label="Use oboku's server as a proxy"
                caption={proxyThroughServerCaption}
              />
            )}
            {!!errors.root && <ErrorAlert error={errors.root.message} />}
            {testConnection && (
              <TestConnection
                connectionData={{
                  url: data.urlValue,
                  username: data.username,
                  passwordAsSecretId: data.passwordAsSecretId,
                  allowSelfSigned: data.allowSelfSigned,
                  proxyThroughServer: data.proxyThroughServer,
                }}
                connectorType={connectorType}
                testConnection={testConnection}
              />
            )}
          </PageSection>
        </form>
        <FormActionsStack>
          {renderExtraActions?.()}
          <Button
            disabled={disabled || !isValid}
            form={FORM_ID}
            type="submit"
            variant="contained"
          >
            Confirm
          </Button>
        </FormActionsStack>
        {children}
      </PageContainer>
    </>
  )
})
