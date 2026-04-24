import { Box, styled, Typography } from "@mui/material"
import type { ComponentProps } from "react"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableRow from "@mui/material/TableRow"
import { isDebugEnabled } from "./isDebugEnabled.shared"

type Info = { [key: string]: string | number }

const StyledRoot = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(1),
  backgroundColor: theme.palette.info.light,
}))

export function DebugInfo({
  info,
  ...rest
}: { info: Info | Info[] } & ComponentProps<typeof Box>) {
  if (!isDebugEnabled()) return null

  return (
    <StyledRoot {...rest}>
      <Box
        sx={{
          mx: 1,
        }}
      >
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
    </StyledRoot>
  )
}
