import { type ComponentProps, memo } from "react"
import type { ObokuPlugin } from "../types"
import {
  Alert,
  AlertTitle,
  Button,
  Container,
  InputAdornment,
  Link,
  Stack,
} from "@mui/material"
import { useForm } from "react-hook-form"
import { ControlledTextField } from "../../common/forms/ControlledTextField"
import { useConnect } from "./useConnect"
import { links } from "@oboku/shared"
import { ControlledSecretSelect } from "../../common/forms/ControlledSecretSelect"
import { useUnlockMasterKey } from "../../secrets/useUnlockMasterKey"
import { useDecryptedSecret } from "../../secrets/useDecryptedSecret"
import { ErrorMessage } from "../../errors/ErrorMessage"
import { useCreateDataSource } from "../../dataSources/useCreateDataSource"
import { useMutation$ } from "reactjrx"
import { from } from "rxjs"

type FormData = {
  url: string
  username: string
  passwordAsSecretId: string
  directory: string
}

const FORM_ID = "webdav-add-data-source"

export const AddDataSource = memo(
  ({ onClose }: ComponentProps<NonNullable<ObokuPlugin["AddDataSource"]>>) => {
    const { masterKey, unlockMasterKey } = useUnlockMasterKey()
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
        directory: "",
      },
    })
    const data = watch()
    const { data: secret } = useDecryptedSecret({
      id: data.passwordAsSecretId,
      masterKey,
      enabled: isValid,
    })
    const {
      status: testingStatus,
      isFetching,
      data: testingData,
    } = useConnect({
      data: {
        url: data.url,
        username: data.username,
        password: secret ?? "",
        directory: `/${data.directory}`,
      },
      enabled: isValid && !!secret,
    })
    const { mutateAsync: addDataSource } = useCreateDataSource()
    const { mutate: submit } = useMutation$({
      mutationFn: (_data: FormData) => {
        return from(
          addDataSource({
            type: "webdav",
            data_v2: { ...data, directory: `/${data.directory}` },
          }),
        )
      },
      onSuccess: onClose,
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
                    /^(https?:\/\/)?([\w-]+\.)+[\w-]+(:\d{1,5})?(\/[\w- .\/?%&=]*)?$/,
                  message: "Invalid URL",
                },
              }}
              fullWidth
            />
            <ControlledTextField
              name="directory"
              label="Directory"
              control={control}
              rules={{ required: true }}
              fullWidth
              slotProps={
                {
                  input: {
                    startAdornment: <InputAdornment position="start">/</InputAdornment>
                  }
                }
              }
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
            <Alert
              severity={
                testingStatus === "pending" || isFetching
                  ? "info"
                  : testingData === false
                    ? "error"
                    : "success"
              }
              sx={{ alignSelf: "stretch" }}
            >
              <AlertTitle>Test connection</AlertTitle>
              {isFetching
                ? "Testing connection..."
                : testingStatus === "pending"
                  ? masterKey
                    ? "Waiting for valid credentials..."
                    : "Please unlock your secrets first"
                  : testingStatus === "success" && testingData === false
                    ? "Unable to connect"
                    : "Connection successful"}
            </Alert>
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
          </Stack>
        </Container>
      </>
    )
  },
)
