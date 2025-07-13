import { memo } from "react"
import { Alert, Button, Container, Link, Stack } from "@mui/material"
import { useForm } from "react-hook-form"
import { links } from "@oboku/shared"
import { useMutation$ } from "reactjrx"
import { from } from "rxjs"
import { useUnlockMasterKey } from "../../../secrets/useUnlockMasterKey"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import { ControlledSecretSelect } from "../../../common/forms/ControlledSecretSelect"
import { ErrorMessage } from "../../../errors/ErrorMessage"
import { useAddConnector } from "./useAddConnector"
import { useNotifications } from "../../../notifications/useNofitications"
import { useConnector } from "./useConnector"
import { useUpdateConnector } from "./useUpdateConnector"
import { TestConnection } from "./TestConnection"

type FormData = {
  url: string
  username: string
  passwordAsSecretId: string
}

const FORM_ID = "webdav-add-data-source"

export const ConnectorForm = memo(
  ({
    onSubmitSuccess,
    children,
    connectorId,
  }: {
    onSubmitSuccess: () => void
    children?: React.ReactNode
    connectorId?: string
  }) => {
    const { masterKey, unlockMasterKey } = useUnlockMasterKey()
    const { data: connector } = useConnector(connectorId)
    const isEditing = !!connectorId
    const {
      control,
      formState: { isValid, disabled, errors },
      watch,
      handleSubmit,
    } = useForm<FormData>({
      mode: "onChange",
      defaultValues: {
        url: "",
        username: "",
        passwordAsSecretId: "",
      },
      values: {
        url: connector?.url ?? "",
        username: connector?.username ?? "",
        passwordAsSecretId: connector?.passwordAsSecretId ?? "",
      },
    })
    const { notify } = useNotifications()
    const data = watch()
    const { mutateAsync: addConnector } = useAddConnector()
    const { mutateAsync: updateConnector } = useUpdateConnector()
    const { mutate: submit } = useMutation$({
      mutationFn: (_data: FormData) => {
        if (isEditing) {
          return from(updateConnector({ id: connectorId, ...data }))
        }

        return from(addConnector(data))
      },
      onSuccess: () => {
        notify("actionSuccess")
        onSubmitSuccess()
      },
    })

    return (
      <>
        <Alert severity="warning">
          Connecting to WebDAV server involves several requirements, make sure
          to <Link href={links.documentationWebDAV}>read this</Link> before
          proceeding.
        </Alert>
        <Container maxWidth="md">
          <Stack
            gap={2}
            mt={2}
            alignSelf="stretch"
            component="form"
            onSubmit={handleSubmit((data) => submit(data))}
            id={FORM_ID}
          >
            <ControlledTextField
              name="url"
              label="URL"
              control={control}
              rules={{
                required: true,
                pattern: {
                  value:
                    /^(https?:\/\/)?([\w-]+\.)+[\w-]+(:\d{1,5})?(\/[\w- ./?%&=]*)?$/,
                  message: "Invalid URL",
                },
              }}
              fullWidth
            />
            <ControlledTextField
              name="username"
              label="Username"
              control={control}
              rules={{ required: true }}
              fullWidth
            />
            <ControlledSecretSelect
              name="passwordAsSecretId"
              label="Password"
              control={control}
              rules={{ required: true }}
              fullWidth
            />
            {!!errors.root && (
              <Alert severity="error">
                <ErrorMessage error={errors.root.message} />
              </Alert>
            )}
            <TestConnection
              url={data.url}
              username={data.username}
              passwordAsSecretId={data.passwordAsSecretId}
            />
          </Stack>
          <Stack gap={1} mt={4}>
            <Button disabled={!!masterKey} onClick={unlockMasterKey}>
              {masterKey ? "Unlocked" : "Unlock secrets"}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={disabled || !isValid}
              form={FORM_ID}
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
