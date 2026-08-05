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
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useObserve } from "reactjrx"
import { EMPTY } from "rxjs"
import { useBookOptimize } from "../BookOptimizeProvider"
import { buildUpdateActions } from "../apply/buildUpdateActions"
import {
  type ApplyLocallyProgress,
  useApplyLocally,
  useApplyLocallyProgress,
  useIsApplyingLocally,
} from "../apply/useApplyLocally"
import { getFileInspectionQueryOptions } from "../useFileInspection"

const ActionBarStack = styled(Stack)(function styleActionBarStack({ theme }) {
  return {
    position: "sticky",
    bottom: 0,
    gap: theme.spacing(1),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  }
})

const DEFAULT_APPLY_LOCALLY_PROGRESS: ApplyLocallyProgress = {
  phase: "preparing",
}

const toPercent = (value: number): number =>
  Math.min(100, Math.max(0, Math.round(value * 100)))

const getApplyLocallyProgressLabel = (
  progress: ApplyLocallyProgress,
): string => {
  if (progress.phase === "preparing") return "Preparing book…"

  if (progress.phase === "optimizing-images") {
    return progress.progress === undefined
      ? "Optimizing images…"
      : `Optimizing images… ${toPercent(progress.progress)}%`
  }

  if (progress.phase === "rebuilding-book-file") {
    return "Rebuilding book file…"
  }

  if (progress.phase === "saving-locally") return "Saving locally…"

  return "Refreshing report…"
}

const getApplyCurrentValuesLocallyMutationKey = (bookId: string) => [
  "books",
  "optimize",
  bookId,
  "apply-current-values-locally",
]

function useApplyCurrentValuesLocally() {
  const { bookId, getValues, reset } = useBookOptimize()
  const queryClient = useQueryClient()
  const { applyLocally } = useApplyLocally({
    meta: { suppressGlobalErrorToast: true },
  })
  const { mutate: applyCurrentValuesLocally, isPending } = useMutation({
    mutationKey: getApplyCurrentValuesLocallyMutationKey(bookId),
    mutationFn: async function applyCurrentValuesLocally() {
      const values = getValues()
      const inspection = await queryClient.ensureQueryData(
        getFileInspectionQueryOptions(bookId),
      )
      const actions = buildUpdateActions(values, inspection)
      const didApply = await applyLocally({ actions, bookId })

      return didApply ? values : undefined
    },
    onSuccess: function resetAppliedValues(values) {
      if (values) reset(values)
    },
  })

  return { applyCurrentValuesLocally, isPending }
}

export function BookOptimizeActionBar() {
  const {
    canUpload: canUploadCurrentFile,
    bookId,
    isDirty,
    isValid,
    isUploading,
    uploadToDataSource,
    revertLocalChanges,
    canRevert,
    isReverting,
    uploadProgress$,
  } = useBookOptimize()
  const { applyCurrentValuesLocally, isPending: isApplyingCurrentValues } =
    useApplyCurrentValuesLocally()
  const applyLocallyProgress$ = useApplyLocallyProgress(bookId)
  const isApplyingLocalOptimizations = useIsApplyingLocally(bookId)
  const isApplyingLocally =
    isApplyingCurrentValues || isApplyingLocalOptimizations

  const { data: applyLocallyProgress = DEFAULT_APPLY_LOCALLY_PROGRESS } =
    useObserve(applyLocallyProgress$ ?? EMPTY)
  const { data: uploadProgress = 0 } = useObserve(uploadProgress$ ?? EMPTY)

  const canUpload = canUploadCurrentFile && !isApplyingLocally
  const canApplyLocally =
    isValid && isDirty && !isApplyingLocally && !isUploading
  const applyLocallyVariant = canUpload ? "outlined" : "contained"
  const uploadVariant = canUpload ? "contained" : "outlined"

  const isApplying = isApplyingLocally || isUploading
  const applyLocallyPercent =
    applyLocallyProgress.phase === "optimizing-images" &&
    applyLocallyProgress.progress !== undefined
      ? toPercent(applyLocallyProgress.progress)
      : undefined
  const applyLocallyProgressLabel =
    getApplyLocallyProgressLabel(applyLocallyProgress)
  const uploadPercent = toPercent(uploadProgress)

  return (
    <ActionBarStack>
      {isApplyingLocally && (
        <Stack spacing={1}>
          <Typography variant="body2">{applyLocallyProgressLabel}</Typography>
          <LinearProgress
            variant={
              applyLocallyPercent === undefined
                ? "indeterminate"
                : "determinate"
            }
            value={applyLocallyPercent}
          />
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
        onClick={function applyCurrentBookValuesLocally() {
          applyCurrentValuesLocally()
        }}
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
