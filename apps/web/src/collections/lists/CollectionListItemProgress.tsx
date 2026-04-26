import { CheckOutlined } from "@mui/icons-material"
import { Box } from "@mui/material"
import { CoverIconBadge } from "../../books/BookCoverCard"

export const CollectionListItemProgress = ({
  progress,
}: {
  progress: number
}) => {
  const isFinished = progress >= 100

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${progress.toFixed(0)}%`,
          bgcolor: "white",
          opacity: 0.5,
        }}
      />
      {isFinished && (
        <CoverIconBadge sx={{ position: "absolute", top: 0, right: 0, m: 1 }}>
          <CheckOutlined color="primary" />
        </CoverIconBadge>
      )}
    </>
  )
}
