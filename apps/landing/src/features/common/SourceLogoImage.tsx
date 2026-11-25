import type { StaticImageData } from "next/image"
import { IconInsetImage } from "./SourceLogoImage.styled"

const chipIconSize = 18

export function SourceLogoImage({
  src,
  size = chipIconSize,
}: {
  src: StaticImageData
  size?: number
}) {
  return <IconInsetImage src={src} alt="" width={size} height={size} />
}
