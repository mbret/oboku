import { CheckCircleOutlineRounded } from "@mui/icons-material"
import { Box } from "@mui/material"

export const CollectionListItemProgress = ({ progress }: { progress: number }) => {
  const isFinished = progress >= 100

  return (
    <>
      <Box
        position="absolute"
        left={0}
        top={0}
        height="100%"
        width={`${progress.toFixed(0)}%`}
        bgcolor="white"
        sx={{
          opacity: 0.5
        }}
      />
      {isFinished && (
        <CheckCircleOutlineRounded
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            m: 1
          }}
        />
      )}
    </>
  )
}
