import {
  CloudUploadOutlined,
  RestoreOutlined,
  SaveOutlined,
} from "@mui/icons-material"
import {
  Button,
  LinearProgress,
  Stack,
  Typography,
  styled,
} from "@mui/material"
import { useObserve } from "reactjrx"
import { EMPTY } from "rxjs"
import { useBookOptimize } from "../BookOptimizeProvider"

const ActionBarStack = styled(Stack)(({ theme }) => ({
  position: "sticky",
  bottom: 0,
  gap: theme.spacing(1),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
}))

const toPercent = (value: number): number =>
  Math.min(100, Math.max(0, Math.round(value * 100)))

export function BookOptimizeActionBar() {
  const {
    canApplyLocally,
    canUpload,
    isApplyingLocally,
    isUploading,
    applyLocally,
    uploadToDataSource,
    revertLocalChanges,
    canRevert,
    isReverting,
    uploadProgress$,
    compressionProgress$,
  } = useBookOptimize()

  const { data: compressionProgress = 0 } = useObserve(
    () => compressionProgress$,
    [compressionProgress$],
  )
  const { data: uploadProgress = 0 } = useObserve(
    () => uploadProgress$ ?? EMPTY,
    [uploadProgress$],
  )

  const applyLocallyVariant = canUpload ? "outlined" : "contained"
  const uploadVariant = canUpload ? "contained" : "outlined"

  const isApplying = isApplyingLocally || isUploading
  const showCompressionProgress = isApplying && compressionProgress > 0
  const compressionPercent = toPercent(compressionProgress)
  const uploadPercent = toPercent(uploadProgress)

  return (
    <ActionBarStack>
      {showCompressionProgress && (
        <Stack spacing={1}>
          <Typography variant="body2">
            Compressing images… {compressionPercent}%
          </Typography>
          <LinearProgress variant="determinate" value={compressionPercent} />
        </Stack>
      )}
      {isUploading && (
        <Stack spacing={1}>
          <Typography variant="body2">Uploading… {uploadPercent}%</Typography>
          <LinearProgress
            variant={uploadPercent > 0 ? "determinate" : "indeterminate"}
            value={uploadPercent}
          />
        </Stack>
      )}
      <Button
        variant={applyLocallyVariant}
        fullWidth
        disabled={!canApplyLocally}
        startIcon={<SaveOutlined />}
        onClick={applyLocally}
      >
        {isApplyingLocally ? "Applying locally…" : "Apply locally"}
      </Button>
      <Button
        variant={uploadVariant}
        fullWidth
        disabled={!canUpload}
        startIcon={<CloudUploadOutlined />}
        onClick={() => {
          void uploadToDataSource()
        }}
      >
        {isUploading ? "Uploading…" : "Upload to data source"}
      </Button>
      {canRevert && (
        <Button
          variant="text"
          color="error"
          size="small"
          disabled={isApplying || isReverting}
          startIcon={<RestoreOutlined />}
          onClick={() => {
            void revertLocalChanges()
          }}
        >
          {isReverting ? "Reverting…" : "Revert local changes"}
        </Button>
      )}
    </ActionBarStack>
  )
}
