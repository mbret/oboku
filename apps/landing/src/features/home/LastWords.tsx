import { Chip, Container, Stack, Typography } from "@mui/material"

export const LastWords = () => {
  return (
    <Container>
      <Stack gap={2}>
        <Chip
          label="Hold on a few more seconds"
          sx={{
            alignSelf: "flex-start",
          }}
        />
        <Typography variant="h4" component="h2">
          Some last important words regarding oboku
        </Typography>
        <Typography>
          We are still in heavy development and have thousands more features to
          implement to content everyone. The strategy for oboku is to prioritize
          what the users requests. If you are using the app, loving it and want
          something, please let us know. There are no better motivation than
          knowing somebody will actually benefit from something.
        </Typography>
        <Typography>
          Inconsistencies, bugs and weird behaviors are to be expected in the
          current state. Please be considerate and remember that your voice can
          improve the project.
        </Typography>
        <Typography>
          It is currently free, without any sort of ads, open source and will
          hopefully stay like this forever. Donations and sponsorship will be
          opened to help sustain the project. The cloud version will stay live
          for as long as we can cover the cost of the infrastructure.
        </Typography>
      </Stack>
    </Container>
  )
}
