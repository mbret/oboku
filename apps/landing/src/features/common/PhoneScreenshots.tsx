"use client"

import { Box, styled } from "@mui/material"
import Image, { type StaticImageData } from "next/image"

export type Screenshot = {
  src: StaticImageData
  alt: string
}

export type PhoneScreenshotSet = {
  primary: Screenshot
  secondary?: Screenshot
  tertiary?: Screenshot
}

type ScreenshotWidths = { xs: number; sm: number }

const primaryScreenshotWidths: ScreenshotWidths = { xs: 200, sm: 260 }
const sideScreenshotWidths: ScreenshotWidths = { xs: 140, sm: 180 }
const sideScreenshotOffsets: ScreenshotWidths = { xs: 72, sm: 100 }

const narrowestFullSizeViewportWidth = 390

function shrinkOnNarrowerViewports(width: number) {
  const viewportShare = (width / narrowestFullSizeViewportWidth) * 100
  return `min(${width}px, ${viewportShare.toFixed(2)}vw)`
}

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
      paddingRight: shrinkOnNarrowerViewports(sideScreenshotOffsets.xs),
      [theme.breakpoints.up("sm")]: {
        paddingRight: sideScreenshotOffsets.sm,
      },
    },
    "&[data-has-tertiary=true]": {
      paddingLeft: shrinkOnNarrowerViewports(sideScreenshotOffsets.xs),
      [theme.breakpoints.up("sm")]: {
        paddingLeft: sideScreenshotOffsets.sm,
      },
    },
  }
})

const ScreenshotImage = styled(Image)(function styleScreenshotImage({ theme }) {
  return {
    position: "relative",
    zIndex: 1,
    display: "block",
    height: "auto",
    borderRadius: theme.spacing(3),
    border: `6px solid ${theme.palette.grey[900]}`,
    boxShadow: theme.shadows[8],
    backgroundColor: theme.palette.common.white,
    width: shrinkOnNarrowerViewports(primaryScreenshotWidths.xs),
    [theme.breakpoints.up("sm")]: {
      width: primaryScreenshotWidths.sm,
    },
  }
})

const SideScreenshotImage = styled(ScreenshotImage)(
  function styleSideScreenshotImage({ theme }) {
    return {
      position: "absolute",
      width: shrinkOnNarrowerViewports(sideScreenshotWidths.xs),
      [theme.breakpoints.up("sm")]: {
        width: sideScreenshotWidths.sm,
      },
    }
  },
)

const SecondaryScreenshotImage = styled(SideScreenshotImage)(
  function styleSecondaryScreenshotImage({ theme }) {
    return {
      right: 0,
      bottom: 0,
      zIndex: 2,
      boxShadow: theme.shadows[16],
    }
  },
)

const TertiaryScreenshotImage = styled(SideScreenshotImage)(
  function styleTertiaryScreenshotImage({ theme }) {
    return {
      left: 0,
      top: theme.spacing(6),
      zIndex: 0,
    }
  },
)

export function PhoneScreenshots({
  primary,
  secondary,
  tertiary,
  preload,
}: PhoneScreenshotSet & { preload?: boolean }) {
  const sideImageSizes = toImageSizes(sideScreenshotWidths)

  return (
    <CenteredBox>
      <PhonesBox
        data-has-secondary={secondary !== undefined}
        data-has-tertiary={tertiary !== undefined}
      >
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
            sizes={sideImageSizes}
          />
        )}
        {tertiary && (
          <TertiaryScreenshotImage
            src={tertiary.src}
            alt={tertiary.alt}
            sizes={sideImageSizes}
          />
        )}
      </PhonesBox>
    </CenteredBox>
  )
}
