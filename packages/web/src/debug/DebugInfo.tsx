import { Box, Typography, useTheme } from "@material-ui/core"
import { ComponentProps, FC } from "react"
import { makeStyles } from "@material-ui/core/styles"
import Table from "@material-ui/core/Table"
import TableBody from "@material-ui/core/TableBody"
import TableCell from "@material-ui/core/TableCell"
import TableContainer from "@material-ui/core/TableContainer"
import TableRow from "@material-ui/core/TableRow"
import { isDebugEnabled } from "./isDebugEnabled.shared"

type Info = { [key: string]: string | number }

export const DebugInfo: FC<
  { info: Info | Info[] } & ComponentProps<typeof Box>
> = ({ info, ...rest }) => {
  const classes = useStyles()
  const theme = useTheme()

  if (!isDebugEnabled()) return null

  return (
    <Box pt={1} bgcolor={theme.palette.info.light} {...rest}>
      <Box mx={1}>
        <Typography>debug:</Typography>
      </Box>
      <TableContainer>
        <Table
          className={classes.table}
          size="small"
          aria-label="a dense table"
        >
          <TableBody>
            {Array.isArray(info) && null}
            {!Array.isArray(info) &&
              Object.keys(info).map((key, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row">
                    {key}
                  </TableCell>
                  <TableCell align="left">{info[key]}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

const useStyles = makeStyles({
  table: {
    minWidth: 650
  }
})
