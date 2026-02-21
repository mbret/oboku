import { Container, styled, Typography } from "@mui/material"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { Page } from "./Page"
import NotFoundImage from "../assets/undraw_page-eaten_b2rt.svg"

const StyledNotFoundImage = styled(`img`)({
  objectFit: "contain",
  maxWidth: 180,
})

export const NotFoundPage = () => {
  return (
    <Page>
      <TopBarNavigation color="transparent" showBack={true} />
      <Container
        maxWidth="xs"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          flex: 1,
        }}
      >
        <Typography variant="h3" textAlign="center">
          Oups!
        </Typography>
        <StyledNotFoundImage src={NotFoundImage} alt="404" />
        <Typography variant="body1" textAlign="center">
          It appears what you were looking for is either gone or never existed.
        </Typography>
      </Container>
    </Page>
  )
}
