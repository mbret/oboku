import { MenuBookOutlined } from "@mui/icons-material"
import { Button } from "@mui/material"
import { Link } from "react-router"
import { getReaderPreviewRoute } from "../../../reader/mode"
import { useIsApplyingLocally } from "../apply/useApplyLocally"

type Props = {
  bookId: string
}

export function TestBookButton({ bookId }: Props) {
  const isApplyingLocally = useIsApplyingLocally(bookId)

  return (
    <Button
      component={Link}
      to={getReaderPreviewRoute(bookId)}
      color="inherit"
      disabled={isApplyingLocally}
      startIcon={<MenuBookOutlined />}
    >
      Test
    </Button>
  )
}
