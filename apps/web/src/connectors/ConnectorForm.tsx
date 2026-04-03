import { memo, type ReactNode } from "react"
import {
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material"
import { Controller, useForm } from "react-hook-form"
import { useMutation$ } from "reactjrx"
import { from } from "rxjs"
import { ControlledSecretSelect } from "../common/forms/ControlledSecretSelect"
import { ControlledTextField } from "../common/forms/ControlledTextField"
import { useToasts } from "../notifications/useToasts"
import type {
  SettingsConnectorDocType,
  SettingsConnectorType,
} from "@oboku/shared"
import { TestConnection, type TestConnectionFn } from "./TestConnection"
import { useAddConnector } from "./useAddConnector"
import { useConnector } from "./useConnector"
import { useUpdateConnector } from "./useUpdateConnector"
import { ErrorAlert } from "../errors/ErrorMessage"

const FORM_ID = "connector-form"

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
    const { notify } = useToasts()
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
        {topAlert}
        <Container maxWidth="md">
          <Stack
            alignSelf="stretch"
            component="form"
            gap={2}
            id={FORM_ID}
            mt={2}
            onSubmit={handleSubmit((values) => submit(values))}
          >
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
                  <Stack gap={0.5}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                        />
                      }
                      label="Allow self-signed certificate"
                    />
                    <Typography color="text.secondary" variant="caption">
                      Used by API sync, metadata, and download requests. Browser
                      connection tests may still require trusting the
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
          </Stack>
          <Stack gap={1} mt={4}>
            {renderExtraActions?.()}
            <Button
              disabled={disabled || !isValid}
              form={FORM_ID}
              type="submit"
              variant="contained"
            >
              Confirm
            </Button>
            {children}
          </Stack>
        </Container>
      </>
    )
  },
)
