import { Box, Typography, Button, Link } from "@mui/material"
import { getMetadataFromBook } from "../books/metadata"
import { useBook } from "../books/states"
import { useNavigate } from "react-router"
import { StreamerFileNotSupportedError } from "../errors/errors.shared"

export const BookError = ({
  manifestError,
  bookId
}: {
  manifestError: unknown
  bookId: string
}) => {
  const { data: book } = useBook({
    id: bookId
  })
  const metadata = getMetadataFromBook(book)
  const navigate = useNavigate()

  if (manifestError instanceof StreamerFileNotSupportedError) {
    return (
      <Box
        sx={{
          margin: "auto",
          maxWidth: 500,
          paddingLeft: (theme) => theme.spacing(2),
          paddingRight: (theme) => theme.spacing(2),
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column"
        }}
      >
        <Box mb={2}>
          <Typography>
            Oups! it looks like the book <b>{metadata?.title}</b> is not
            supported yet. If you would like to be able to open it please visit
            the{" "}
            <Link href="https://docs.oboku.me" target="__blank">
              documentation
            </Link>{" "}
            and try to reach out.
          </Typography>
        </Box>
        <Button
          onClick={() => navigate(-1)}
          variant="contained"
          color="primary"
        >
          Go back
        </Button>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        margin: "auto",
        maxWidth: 500,
        paddingLeft: (theme) => theme.spacing(2),
        paddingRight: (theme) => theme.spacing(2),
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column"
      }}
    >
      <Box mb={2}>
        <Typography variant="h6" align="center">
          Oups!
        </Typography>
        <Typography align="center">
          Sorry it looks like we are unable to load the book. If the problem
          persist try to restart the app. If it still does not work,{" "}
          <Link href="https://docs.oboku.me/support" target="__blank">
            contact us
          </Link>
        </Typography>
      </Box>
      <Button onClick={() => navigate(-1)} variant="contained" color="primary">
        Go back
      </Button>
    </Box>
  )
}
