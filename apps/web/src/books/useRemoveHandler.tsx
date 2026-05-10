import { useMutation } from "@tanstack/react-query"
import { createCustomDialog } from "../common/dialogs/createCustomDialog"
import { RemoveBooksDialog } from "./RemoveBooksDialog"
import { type RemoveBooksPayload, useRemoveBooks } from "./useRemoveBooks"

function getUniqueValues<T>(values: readonly T[]) {
  return Array.from(new Set(values))
}

const confirmRemoveBooks = async ({
  bookIds,
}: {
  bookIds: readonly string[]
}) => {
  return createCustomDialog<RemoveBooksPayload>({
    render: ({ cancel, confirm }) => (
      <RemoveBooksDialog
        bookIds={bookIds}
        onCancel={cancel}
        onConfirm={confirm}
      />
    ),
  }).promise
}

export const useRemoveHandler = (options: { onSuccess?: () => void } = {}) => {
  const { mutateAsync: removeBooks } = useRemoveBooks()

  return useMutation({
    meta: {
      suppressGlobalErrorToast: true,
    },
    mutationFn: async ({ bookIds }: { bookIds: readonly string[] }) => {
      const uniqueBookIds = getUniqueValues(bookIds)

      if (uniqueBookIds.length === 0) {
        return
      }

      const payload = await confirmRemoveBooks({ bookIds: uniqueBookIds })

      if (!payload) {
        return
      }

      await removeBooks(payload)
    },
    onSuccess: () => {
      options.onSuccess?.()
    },
  })
}
