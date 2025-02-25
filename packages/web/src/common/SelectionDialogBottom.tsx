import { Box, Button, Typography } from "@mui/material"

export const SelectionDialogBottom = ({
  onClose,
  numberOfItemsSelected,
}: {
  onClose: () => void
  numberOfItemsSelected: number
}) => {
  return (
    <Box
      sx={{
        padding: (theme) =>
          `${theme.spacing(1)} ${theme.spacing(2)} ${theme.spacing(
            2,
          )} ${theme.spacing(2)}`,
        borderTop: (theme) => `1px solid ${theme.palette["grey"]["500"]}`,
      }}
    >
      <Typography gutterBottom align="center" variant="body2">
        {numberOfItemsSelected} item(s) selected
      </Typography>
      <Button
        style={{
          width: "100%",
        }}
        variant="outlined"
        color="primary"
        onClick={onClose}
      >
        Ok
      </Button>
    </Box>
  )
}
