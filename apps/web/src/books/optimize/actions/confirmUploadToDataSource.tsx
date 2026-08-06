import {
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
  styled,
} from "@mui/material"
import { showConfirmDialog } from "../../../common/dialogs/presets"

const VersionHistoryFormControlLabel = styled(FormControlLabel)({
  alignItems: "flex-start",
  marginLeft: 0,
  marginRight: 0,
})

function VersionHistoryOption({ providerName }: { providerName: string }) {
  return (
    <VersionHistoryFormControlLabel
      control={<Checkbox checked disabled size="small" />}
      label={
        <Stack>
          <Typography variant="body2">Replace the version history</Typography>
          <Typography variant="caption" color="text.secondary">
            {providerName} keeps every previous version of a file, which still
            uses up your storage. They will be deleted so only the uploaded file
            remains.
          </Typography>
        </Stack>
      }
    />
  )
}

function UploadMessage({
  providerName,
  prunesVersionHistory,
}: {
  providerName: string
  prunesVersionHistory: boolean
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        This will overwrite the file on the remote data source with the current
        local file.
      </Typography>
      {prunesVersionHistory && (
        <VersionHistoryOption providerName={providerName} />
      )}
    </Stack>
  )
}

export async function confirmUploadToDataSource({
  providerName,
  prunesVersionHistory,
}: {
  providerName: string
  prunesVersionHistory: boolean
}): Promise<boolean> {
  return showConfirmDialog({
    message: (
      <UploadMessage
        providerName={providerName}
        prunesVersionHistory={prunesVersionHistory}
      />
    ),
  })
}
