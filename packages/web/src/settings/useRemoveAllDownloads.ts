import { useMutation$ } from "reactjrx"
import { useRemoveAllDownloadedFiles } from "../download/useRemoveAllDownloadedFiles"
import { from, of } from "rxjs"

export const useRemoveAllDownloads = ({
  onSuccess,
}: {
  onSuccess: () => void
}) => {
  const { mutateAsync: deleteAllDownloadedFiles } =
    useRemoveAllDownloadedFiles()

  return useMutation$({
    onSuccess,
    mutationFn: () => {
      const isConfirmed = confirm(
        "Are you sure you want to delete all downloads at once?",
      )

      if (isConfirmed) {
        return from(deleteAllDownloadedFiles())
      }

      return of(null)
    },
  })
}
