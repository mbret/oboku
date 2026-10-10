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
import Image, { type StaticImageData } from "next/image"

const KeyCardPoint = ({
  description,
  imageSrc,
  imageAlt,
  title,
}: {
  title: string
  description: string
  imageSrc: StaticImageData
  imageAlt: string
}) => {
  return (
    <Card sx={{ display: "flex" }} variant="outlined">
      <CardContent>
        <Typography gutterBottom variant="h5" component="h3">
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
        alt={imageAlt}
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
            description="Support zip (.cbz, .epub), rar (.cbr), .pdf and many more formats to come!"
            imageSrc={image1}
            imageAlt="oboku reader displaying a chapter of an EPUB novel"
          />
          <KeyCardPoint
            title="Anywhere"
            description="Oboku is a web app. If you have a browser on any device — phone, tablet, or desktop — you have oboku."
            imageSrc={image2}
            imageAlt="oboku book details page with cover, authors and download button"
          />
          <KeyCardPoint
            title="Anytime"
            description="Works fully offline, just make sure to download your books before a long trip"
            imageSrc={image3}
            imageAlt="oboku storage screen listing books downloaded for offline reading"
          />
          <KeyCardPoint
            title="Your books"
            description="Synchronize your own books and make your library in a few taps. We support Google Drive, Dropbox, OneDrive, Synology, WebDAV and many more"
            imageSrc={image4}
            imageAlt="oboku data sources screen with a Google Drive library being synchronized"
          />
          <KeyCardPoint
            title="Sharing is caring"
            description="Want to share your library? Simply share your drive and your friends will be able to build their own library just as easily."
            imageSrc={image8}
            imageAlt="Adding an oboku data source from Dropbox or Google Drive"
          />
          <KeyCardPoint
            title="E-ink support"
            description="E-ink mode available. Increase contrast and remove all animations"
            imageSrc={image9}
            imageAlt="oboku library in e-ink mode, with a high-contrast monochrome interface"
          />
          <KeyCardPoint
            title="Open Source & Self Host"
            description="Fully public and open source. You are welcome to contribute or self host it yourself."
            imageSrc={image6}
            imageAlt="oboku home screen with continue reading and recently added books"
          />
          <KeyCardPoint
            title="Free"
            description="We believe in open source, giving the control back to users and will fight against ads."
            imageSrc={image5}
            imageAlt="Black and white manga page open in the oboku reader"
          />
        </Box>
      </Stack>
    </Container>
  )
}
