import { Button, type ButtonProps } from "@mantine/core"

type ConfirmButtonProps = ButtonProps & {
  confirmMessage: string
  onConfirm: () => void | Promise<void>
}

export const ConfirmButton = ({
  confirmMessage,
  onConfirm,
  ...buttonProps
}: ConfirmButtonProps) => (
  <Button
    {...buttonProps}
    onClick={() => {
      if (!window.confirm(confirmMessage)) return
      onConfirm()
    }}
  />
)
