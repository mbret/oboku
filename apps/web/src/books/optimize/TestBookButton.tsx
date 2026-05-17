import { MenuBookOutlined } from "@mui/icons-material"
import { Button } from "@mui/material"
import { createSearchParams, generatePath, Link } from "react-router"
import { ROUTES } from "../../navigation/routes"
import {
  READER_MODE_PARAM,
  READER_PREVIEW_MODE,
} from "../../reader/ReaderScreen"

type Props = {
  bookId: string
}

export function TestBookButton({ bookId }: Props) {
  return (
    <Button
      component={Link}
      to={{
        pathname: generatePath(ROUTES.READER, { id: bookId }),
        search: createSearchParams({
          [READER_MODE_PARAM]: READER_PREVIEW_MODE,
        }).toString(),
      }}
      variant="outlined"
      fullWidth
      startIcon={<MenuBookOutlined />}
    >
      Test book
    </Button>
  )
}
