import { Typography, useTheme } from "@mui/material"
import EmptyLibraryAsset from "../../../assets/empty-library.svg"
import { memo } from "react"

export const EmptyList = memo(() => {
  const theme = useTheme()

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          justifyContent: "center",
          flexFlow: "column",
          alignItems: "center",
          textAlign: "center",
          width: "80%",
          maxWidth: theme.custom.maxWidthCenteredContent,
        }}
      >
        <img
          style={{
            width: "100%",
          }}
          src={EmptyLibraryAsset}
          alt="libray"
        />
        <Typography style={{ maxWidth: 300, paddingTop: theme.spacing(1) }}>
          It looks like your library is empty for the moment. Maybe it's time to
          add a new book
        </Typography>
      </div>
    </div>
  )
})
