import { Box, styled } from "@mui/material"
import Image, { type StaticImageData } from "next/image"

export type Screenshot = {
  src: StaticImageData
  alt: string
}

export type PhoneScreenshotPair = {
  primary: Screenshot
  secondary?: Screenshot
}

type ScreenshotWidths = { xs: number; sm: number }

const primaryScreenshotWidths: ScreenshotWidths = { xs: 200, sm: 260 }
const secondaryScreenshotWidths: ScreenshotWidths = { xs: 140, sm: 180 }

function toImageSizes({ xs, sm }: ScreenshotWidths) {
  return `(max-width: 599px) ${xs}px, ${sm}px`
}

const CenteredBox = styled(Box)({
  display: "flex",
  justifyContent: "center",
})

const PhonesBox = styled(Box)(function stylePhonesBox({ theme }) {
  return {
    position: "relative",
    paddingBottom: theme.spacing(5),
    "&[data-has-secondary=true]": {
      paddingRight: 72,
      [theme.breakpoints.up("sm")]: {
        paddingRight: 100,
      },
    },
  }
})

const ScreenshotImage = styled(Image)(function styleScreenshotImage({ theme }) {
  return {
    display: "block",
    height: "auto",
    borderRadius: theme.spacing(3),
    border: `6px solid ${theme.palette.grey[900]}`,
    boxShadow: theme.shadows[8],
    backgroundColor: theme.palette.common.white,
    width: primaryScreenshotWidths.xs,
    [theme.breakpoints.up("sm")]: {
      width: primaryScreenshotWidths.sm,
    },
  }
})

const SecondaryScreenshotImage = styled(ScreenshotImage)(
  function styleSecondaryScreenshotImage({ theme }) {
    return {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: secondaryScreenshotWidths.xs,
      boxShadow: theme.shadows[16],
      [theme.breakpoints.up("sm")]: {
        width: secondaryScreenshotWidths.sm,
      },
    }
  },
)

export function PhoneScreenshots({
  primary,
  secondary,
  preload,
}: PhoneScreenshotPair & { preload?: boolean }) {
  return (
    <CenteredBox>
      <PhonesBox data-has-secondary={secondary !== undefined}>
        <ScreenshotImage
          src={primary.src}
          alt={primary.alt}
          sizes={toImageSizes(primaryScreenshotWidths)}
          preload={preload}
        />
        {secondary && (
          <SecondaryScreenshotImage
            src={secondary.src}
            alt={secondary.alt}
            sizes={toImageSizes(secondaryScreenshotWidths)}
          />
        )}
      </PhonesBox>
    </CenteredBox>
  )
}
