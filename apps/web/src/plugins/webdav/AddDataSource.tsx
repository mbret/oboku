import { type ComponentProps, memo } from "react"
import type { ObokuPlugin } from "../types"
import {
  Alert,
  Button,
  Container,
  InputAdornment,
  Link,
  Stack,
} from "@mui/material"
import { useForm } from "react-hook-form"
import { ControlledTextField } from "../../common/forms/ControlledTextField"
import { links } from "@oboku/shared"
import { useUnlockMasterKey } from "../../secrets/useUnlockMasterKey"
import { ErrorMessage } from "../../errors/ErrorMessage"
import { useCreateDataSource } from "../../dataSources/useCreateDataSource"
import { useMutation$ } from "reactjrx"
import { from } from "rxjs"
import { useConnectors } from "./connectors/useConnectors"
import { ControlledSelect } from "../../common/forms/ControlledSelect"
import { LinkRounded } from "@mui/icons-material"
import { TestConnection } from "./connectors/TestConnection"
import { useConnector } from "./connectors/useConnector"

type FormData = {
  connectorId: string
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
        connectorId: "",
        directory: "",
      },
    })
    const data = watch()
    const { data: connectors } = useConnectors()
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
    const { data: connector } = useConnector(data.connectorId)

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
              name="directory"
              label="Directory"
              control={control}
              rules={{ required: false }}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">/</InputAdornment>
                  ),
                },
              }}
            />
            <ControlledSelect
              options={
                connectors?.map((connector) => ({
                  label: `${connector.url}@${connector.username}`,
                  value: connector.id,
                  id: connector.id,
                })) ?? []
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkRounded />
                    </InputAdornment>
                  ),
                },
              }}
              helperText="Select a connector to use"
              name="connectorId"
              fullWidth
              rules={{ required: true }}
              control={control}
            />
            {!!errors.root && (
              <Alert severity="error">
                <ErrorMessage error={errors.root.message} />
              </Alert>
            )}
            <TestConnection
              url={connector?.url}
              username={connector?.username}
              passwordAsSecretId={connector?.passwordAsSecretId}
              directory={data.directory}
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
          </Stack>
        </Container>
      </>
    )
  },
)
