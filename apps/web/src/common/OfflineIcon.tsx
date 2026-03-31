import { PortableWifiOffRounded } from "@mui/icons-material"
import { Box } from "@mui/material"
import { useNetworkState } from "react-use"

export const OfflineIcon = () => {
  const network = useNetworkState()

  if (network.online) return null

  return (
    <Box
      sx={{
        position: "absolute",
        backgroundColor: ({ palette }) => palette.grey["700"],
        display: "flex",
        left: -5,
        bottom: -5,
        padding: 1,
        borderTopRightRadius: 5,
      }}
    >
      <PortableWifiOffRounded fontSize="small" style={{ color: "white" }} />
    </Box>
  )
}
