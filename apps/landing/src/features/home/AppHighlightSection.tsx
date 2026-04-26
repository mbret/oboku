import {
  Box,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material"
import image1 from "./assets/image1.png"
import image2 from "./assets/image2.png"
import image3 from "./assets/image3.png"
import image4 from "./assets/image4.png"
import image5 from "./assets/image5.png"
import image6 from "./assets/image6.png"
import image8 from "./assets/image8.png"
import image9 from "./assets/image9.png"
import Image from "next/image"

const KeyCardPoint = ({
  description,
  imageSrc,
  title,
}: {
  title: string
  description: string
  imageSrc: any
}) => {
  return (
    <Card sx={{ display: "flex" }} variant="outlined">
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
          }}
        >
          {description}
        </Typography>
      </CardContent>
      <Image
        style={{ width: "50%", height: "auto" }}
        src={imageSrc}
        alt={`oboku feature: ${title} — ${description}`}
      />
    </Card>
  )
}

export const AppHighlightSection = () => {
  return (
    <Container>
      <Stack
        sx={{
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h2">
          Key features
        </Typography>
        <Typography>
          Everything you need to manage and read your personal ebook library.
        </Typography>
        <Box
          sx={{
            mt: 4,
            display: "grid",
            gridTemplateColumns: ["1fr", "1fr 1fr"],
            gap: 5,
          }}
        >
          <KeyCardPoint
            title="Anything"
            description="Support zip (.cbz, .epub), rar (.cbr), .pdf and many more formats to
                come!"
            imageSrc={image1}
          />
          <KeyCardPoint
            title="Anywhere"
            description="Oboku is a web app. If you have a browser on any device — phone, tablet, or desktop — you have oboku."
            imageSrc={image2}
          />
          <KeyCardPoint
            title="Anytime"
            description="Works fully offline, just make sure to download your books before a long trip"
            imageSrc={image3}
          />
          <KeyCardPoint
            title="Your books"
            description="Synchronize your own books and make your library in a few taps. We support Google Drive, Dropbox, Synology, WebDAV and many more"
            imageSrc={image4}
          />
          <KeyCardPoint
            title="Sharing is caring"
            description="Want to share your library? Simply share your drive and your friends will be able to build their own library just as easily."
            imageSrc={image8}
          />
          <KeyCardPoint
            title="E-ink support"
            description="E-ink mode available. Increase contrast and remove all animations"
            imageSrc={image9}
          />
          <KeyCardPoint
            title="Open Source & Self Host"
            description="Fully public and open source. You are welcome to contribute or self host it yourself."
            imageSrc={image6}
          />
          <KeyCardPoint
            title="Free"
            description="We believe in open source, giving the control back to users and will fight against ads."
            imageSrc={image5}
          />
        </Box>
      </Stack>
    </Container>
  )
}
