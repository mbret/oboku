import { createLink, type LinkComponent } from "@tanstack/react-router"
import { Button, type ButtonProps } from "@mantine/core"

const MUIButtonLinkComponent = (props: ButtonProps) => (
  <Button component="a" {...props} />
)

const CreatedLinkComponent = createLink(MUIButtonLinkComponent)

export const ButtonLink: LinkComponent<typeof MUIButtonLinkComponent> = (
  props,
) => {
  return <CreatedLinkComponent preload={"intent"} {...props} />
}
