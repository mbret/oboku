import { Box, Typography, useTheme } from "@mui/material"
import type { ComponentProps, FC } from "react"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableRow from "@mui/material/TableRow"
import { isDebugEnabled } from "./isDebugEnabled.shared"

type Info = { [key: string]: string | number }

export const DebugInfo: FC<
  { info: Info | Info[] } & ComponentProps<typeof Box>
> = ({ info, ...rest }) => {
  const theme = useTheme()

  if (!isDebugEnabled()) return null

  return (
    <Box pt={1} bgcolor={theme.palette.info.light} {...rest}>
      <Box mx={1}>
        <Typography>debug:</Typography>
      </Box>
      <TableContainer>
        <Table
          style={{
            minWidth: 650,
          }}
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
