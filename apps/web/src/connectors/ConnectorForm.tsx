import { memo, type ReactNode } from "react"
import {
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  styled,
  Typography,
} from "@mui/material"
import { Controller, useForm } from "react-hook-form"
import { useMutation$ } from "reactjrx"
import { from } from "rxjs"
import { ControlledSecretSelect } from "../common/forms/ControlledSecretSelect"
import { ControlledTextField } from "../common/forms/ControlledTextField"
import { notify } from "../notifications/toasts"
import type {
  SettingsConnectorDocType,
  SettingsConnectorType,
} from "@oboku/shared"
import { TestConnection, type TestConnectionFn } from "./TestConnection"
import { useAddConnector } from "./useAddConnector"
import { useConnector } from "./useConnector"
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

function getConnectorUrl(
  connector: SettingsConnectorDocType | undefined,
): string {
  return connector?.url ?? ""
}

const URL_PATTERN = {
  value: /^(https?:\/\/)?([\w-]+\.)*[\w-]+(:\d{1,5})?(\/[\w- ./?%&=]*)?$/,
  message: "Invalid URL",
}

export type FormData = {
  urlValue: string
  username: string
  passwordAsSecretId: string
  allowSelfSigned: boolean
}

export type ConnectorFormConfig = {
  connectorType: SettingsConnectorType
  connectorId?: string
  onSubmitSuccess: () => void
  /** Rendered below the form's actions, in a `PageContainer` with `disableGutters`. */
  children?: ReactNode
  /** When false the URL field and "Allow self-signed certificate" checkbox are hidden. Defaults to true. */
  showUrl?: boolean
  topAlert: ReactNode
  passwordFieldLabel?: string
  /** When provided, TestConnection is rendered; parent provides the async method to test the connection. */
  testConnection?: TestConnectionFn
  renderExtraActions?: () => ReactNode
}

export const ConnectorForm = memo(
  ({
    connectorType,
    connectorId,
    onSubmitSuccess,
    children,
    showUrl = true,
    topAlert,
    passwordFieldLabel = "Password secret",
    testConnection,
    renderExtraActions,
  }: ConnectorFormConfig) => {
    // react-hook-form is on React Compiler's incompatible-library list.
    // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
    "use no memo"

    const { data: connector } = useConnector({
      id: connectorId,
      type: connectorType,
    })
    const isEditing = !!connectorId
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
      },
      values: {
        urlValue: getConnectorUrl(connector),
        username: connector?.username ?? "",
        passwordAsSecretId: connector?.passwordAsSecretId ?? "",
        allowSelfSigned: connector?.allowSelfSigned ?? false,
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
          <form
            id={FORM_ID}
            onSubmit={handleSubmit((values) => submit(values))}
          >
            <PageSection variant="stack">
              {showUrl && (
                <ControlledTextField
                  control={control}
                  fullWidth
                  label="URL"
                  name="urlValue"
                  rules={{ required: true, pattern: URL_PATTERN }}
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
                <Controller
                  control={control}
                  name="allowSelfSigned"
                  render={({ field }) => (
                    <Stack
                      sx={{
                        gap: 0.5,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!field.value}
                            onChange={(_, checked) => field.onChange(checked)}
                          />
                        }
                        label="Allow self-signed certificate"
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                        }}
                      >
                        Used by API sync, metadata, and download requests.
                        Browser connection tests may still require trusting the
                        certificate in your browser.
                      </Typography>
                    </Stack>
                  )}
                />
              )}
              {!!errors.root && <ErrorAlert error={errors.root.message} />}
              {testConnection && (
                <TestConnection
                  connectionData={{ ...data, url: data.urlValue }}
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
  },
)
