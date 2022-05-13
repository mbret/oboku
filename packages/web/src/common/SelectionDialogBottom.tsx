import { Button, Typography, useTheme } from "@mui/material"
import { useCSS } from "./utils"

export const SelectionDialogBottom = ({
  onClose,
  numberOfItemsSelected
}: {
  onClose: () => void
  numberOfItemsSelected: number
}) => {
  const styles = useStyles()

  return (
    <div style={styles.buttonContainer}>
      <Typography gutterBottom align="center" variant="body2">
        {numberOfItemsSelected} item(s) selected
      </Typography>
      <Button
        style={styles.button}
        variant="outlined"
        color="primary"
        onClick={onClose}
      >
        Ok
      </Button>
    </div>
  )
}

const useStyles = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      buttonContainer: {
        padding: `${theme.spacing(1)} ${theme.spacing(2)} ${theme.spacing(
          2
        )} ${theme.spacing(2)}`,
        borderTop: `1px solid ${theme.palette["grey"]["500"]}`
      },
      button: {
        width: "100%"
      }
    }),
    [theme]
  )
}
