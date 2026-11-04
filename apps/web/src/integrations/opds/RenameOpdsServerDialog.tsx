import { useState } from "react"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material"
import { type OpdsServerDto, zRenameOpdsServerDto } from "@oboku/shared"
import { CancelButton } from "../../common/forms/CancelButton"
import { useRenameOpdsServer } from "./useRenameOpdsServer"

const serverNameSchema = zRenameOpdsServerDto.shape.name

export function RenameOpdsServerDialog({
  server,
  onClose,
}: {
  server: OpdsServerDto
  onClose: () => void
}) {
  const [name, setName] = useState(server.name)
  const { mutate: rename, isPending } = useRenameOpdsServer()
  const trimmedName = name.trim()
  const isNameAccepted = serverNameSchema.safeParse(trimmedName).success

  return (
    <Dialog open onClose={onClose}>
      <form
        onSubmit={function saveName(event) {
          event.preventDefault()
          rename({ id: server.id, name: trimmedName }, { onSuccess: onClose })
        }}
      >
        <DialogTitle>Rename the server</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Name"
            margin="normal"
            fullWidth
            value={name}
            onChange={function updateName(event) {
              setName(event.target.value)
            }}
            slotProps={{
              htmlInput: { maxLength: serverNameSchema.maxLength ?? undefined },
            }}
          />
        </DialogContent>
        <DialogActions>
          <CancelButton onClick={onClose} />
          <Button type="submit" loading={isPending} disabled={!isNameAccepted}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
