import { Button, Chip, Stack, styled } from "@mui/material"
import { useNavigate } from "react-router"
import { useTags } from "../../tags/helpers"
import { useBook } from "../states"
import { EditOutlined } from "@mui/icons-material"
import { ROUTES } from "../../navigation/routes"

const TagsRowStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(1),
}))

export const TagsRow = ({ bookId }: { bookId?: string }) => {
  const { data: book } = useBook({ id: bookId })
  const navigate = useNavigate()
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
    <TagsRowStack>
      {tags?.map((tag) => (
        <Chip label={tag.name} size="small" key={tag._id} onClick={() => {}} />
      ))}
      <Button
        size="small"
        variant="text"
        onClick={() => {
          if (book?._id) {
            navigate(ROUTES.BOOK_TAGS.replace(":id", book._id))
          }
        }}
        startIcon={<EditOutlined />}
      >
        Edit tags
      </Button>
    </TagsRowStack>
  )
}
