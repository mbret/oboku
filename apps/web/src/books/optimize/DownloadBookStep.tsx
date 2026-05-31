import {
  Button,
  LinearProgress,
  Stack,
  Typography,
  styled,
} from "@mui/material"
import type { BookDocType } from "@oboku/shared"
import { useEffect } from "react"
import type { DeepReadonlyObject } from "rxdb"
import { useCancelBookDownload, useDownloadBook } from "../../download"
import { useBookDownloadState } from "../../download/states"

const DownloadBookStepRootStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}))

const DownloadProgressStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}))

type Props = {
  book: DeepReadonlyObject<BookDocType>
  displayFileName: string | undefined
}

export function DownloadBookStep({ book, displayFileName }: Props) {
  const downloadState = useBookDownloadState(book._id)
  const { mutate: downloadBook } = useDownloadBook()
  const cancelBookDownload = useCancelBookDownload()

  const isDownloading = downloadState?.isDownloading ?? false
  const downloadProgress = downloadState?.downloadProgress ?? 0

  const handleDownload = () => {
    downloadBook({
      _id: book._id,
      links: [...book.links],
    })
  }

  useEffect(
    () => () => {
      cancelBookDownload(book._id)
    },
    [book._id, cancelBookDownload],
  )

  return (
    <DownloadBookStepRootStack>
      <Stack spacing={1}>
        <Typography variant="h6">Download the book first</Typography>
        <Typography variant="body2" color="text.secondary">
          Metadata and content optimization work on the downloaded file.
        </Typography>
        {displayFileName && (
          <Typography variant="body2">{displayFileName}</Typography>
        )}
      </Stack>
      {isDownloading ? (
        <DownloadProgressStack>
          <Typography variant="body2">
            Downloading… {downloadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={downloadProgress} />
        </DownloadProgressStack>
      ) : (
        <Button variant="contained" onClick={handleDownload}>
          Download book
        </Button>
      )}
    </DownloadBookStepRootStack>
  )
}
