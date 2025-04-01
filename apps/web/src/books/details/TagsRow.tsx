import { Button, Chip, Stack } from "@mui/material"
import { useTags } from "../../tags/helpers"
import { useBook } from "../states"
import { EditOutlined } from "@mui/icons-material"
import { useManageBookTagsDialog } from "../ManageBookTagsDialog"

export const TagsRow = ({ bookId }: { bookId?: string }) => {
  const { data: book } = useBook({ id: bookId })
  const { openManageBookTagsDialog } = useManageBookTagsDialog()
  const { data: tags } = useTags({
    enabled: !!book?.tags.length,
    queryObj: {
      selector: {
        _id: {
          $in: Array.from(book?.tags ?? []),
        },
      },
    },
  })

  return (
    <Stack flexDirection="row" gap={1} alignItems="center">
      {tags?.map((tag) => (
        <Chip label={tag.name} size="small" key={tag._id} onClick={() => {}} />
      ))}
      <Button
        size="small"
        variant="text"
        onClick={() => {
          book?._id && openManageBookTagsDialog(book?._id)
        }}
        startIcon={<EditOutlined />}
      >
        Edit tags
      </Button>
    </Stack>
  )
}
