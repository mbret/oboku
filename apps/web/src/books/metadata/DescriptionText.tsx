import { styled } from "@mui/material"
import { getDescriptionText } from "./description"

const PreLineSpan = styled("span")({ whiteSpace: "pre-line" })

/** A book description, as text with its paragraphs and line breaks. */
export const DescriptionText = ({ description }: { description: string }) => (
  <PreLineSpan>{getDescriptionText(description)}</PreLineSpan>
)
