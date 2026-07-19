import { Button, Group, Modal, Stack } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { type ReactNode, useState } from "react"

export const useConfirmableSubmit = <TValues,>() => {
  const [opened, { open, close }] = useDisclosure(false)
  const [pendingValues, setPendingValues] = useState<TValues | null>(null)

  const request = (values: TValues) => {
    setPendingValues(values)
    open()
  }

  const reset = () => {
    setPendingValues(null)
    close()
  }

  return { opened, pendingValues, request, close, reset }
}

type ConfirmModalProps = {
  opened: boolean
  onClose: () => void
  title: string
  confirmLabel: string
  onConfirm: () => void
  pending: boolean
  confirmColor?: string
  children: ReactNode
}

export const ConfirmModal = ({
  opened,
  onClose,
  title,
  confirmLabel,
  onConfirm,
  pending,
  confirmColor = "red",
  children,
}: ConfirmModalProps) => (
  <Modal opened={opened} onClose={onClose} title={title} centered>
    <Stack gap="md">
      {children}
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button color={confirmColor} onClick={onConfirm} loading={pending}>
          {confirmLabel}
        </Button>
      </Group>
    </Stack>
  </Modal>
)
