import {
  CONVERTIBLE_IMAGE_FORMAT_NAMES,
  type WebArchiveUpdateAction,
} from "@oboku/archive-metadata/web"
import { FiberManualRecord } from "@mui/icons-material"
import {
  Chip,
  List,
  ListItem,
  ListItemIcon,
  Stack,
  Typography,
  styled,
} from "@mui/material"
import { Fragment, type ReactNode } from "react"
import { showConfirmDialog } from "../../../common/dialogs/presets"
import { CONTAINER_LABELS } from "../metadata/targets"

const BulletListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  minWidth: theme.spacing(3),
  fontSize: theme.typography.pxToRem(7),
}))

const UpdateContentStack = styled(Stack)({
  flex: 1,
  minWidth: 0,
})

function KeyChip({ label }: { label: string }) {
  return <Chip label={label} size="small" variant="outlined" />
}

function UpdateListItem({ children }: { children: ReactNode }) {
  return (
    <ListItem disableGutters alignItems="flex-start">
      <BulletListItemIcon>
        <FiberManualRecord fontSize="inherit" />
      </BulletListItemIcon>
      <UpdateContentStack>
        <Typography component="div" variant="body2">
          {children}
        </Typography>
      </UpdateContentStack>
    </ListItem>
  )
}

function MetadataTargetChips({ targets }: { targets: string[] }) {
  return targets.map(function renderMetadataTarget(target, index) {
    return (
      <Fragment key={target}>
        {index > 0 ? " and " : null}
        <KeyChip label={target} />
      </Fragment>
    )
  })
}

function MetadataUpdateItems({
  action,
}: {
  action: Extract<WebArchiveUpdateAction, { kind: "patch-metadata" }>
}) {
  const targets: string[] = []

  if (action.targets.comicInfo) targets.push(CONTAINER_LABELS.comicInfo)
  if (action.targets.opf) targets.push(CONTAINER_LABELS.opf)

  return action.patch.isbn === undefined ? (
    <UpdateListItem>
      Remove the ISBN from <MetadataTargetChips targets={targets} />.
    </UpdateListItem>
  ) : (
    <UpdateListItem>
      Set the ISBN to <KeyChip label={action.patch.isbn} /> in{" "}
      <MetadataTargetChips targets={targets} />.
    </UpdateListItem>
  )
}

function ImageResizeUpdateItem({
  maxWidth,
  maxHeight,
}: {
  maxWidth: number | undefined
  maxHeight: number | undefined
}) {
  const formats = CONVERTIBLE_IMAGE_FORMAT_NAMES.join(" · ")

  if (maxWidth !== undefined && maxHeight !== undefined) {
    return (
      <UpdateListItem>
        Resize eligible <KeyChip label={formats} /> images to fit within{" "}
        <KeyChip label={`${maxWidth} × ${maxHeight} px`} />.
      </UpdateListItem>
    )
  }

  if (maxWidth !== undefined) {
    return (
      <UpdateListItem>
        Resize eligible <KeyChip label={formats} /> images to a maximum width of{" "}
        <KeyChip label={`${maxWidth} px`} />.
      </UpdateListItem>
    )
  }

  if (maxHeight !== undefined) {
    return (
      <UpdateListItem>
        Resize eligible <KeyChip label={formats} /> images to a maximum height
        of <KeyChip label={`${maxHeight} px`} />.
      </UpdateListItem>
    )
  }

  return null
}

function ImageCompressionUpdateItems({
  action,
}: {
  action: Extract<WebArchiveUpdateAction, { kind: "compress-images" }>
}) {
  return (
    <>
      <ImageResizeUpdateItem {...action.config} />
      <UpdateListItem>
        Convert images to <KeyChip label="WebP" /> when the result is smaller.
      </UpdateListItem>
      <UpdateListItem>Update references to converted images.</UpdateListItem>
    </>
  )
}

function UpdateActionItems({ action }: { action: WebArchiveUpdateAction }) {
  return action.kind === "patch-metadata" ? (
    <MetadataUpdateItems action={action} />
  ) : (
    <ImageCompressionUpdateItems action={action} />
  )
}

function ApplyUpdateMessage({
  actions,
}: {
  actions: WebArchiveUpdateAction[]
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Review the updates that will be made before continuing.
      </Typography>
      {actions.length > 0 && (
        <Stack spacing={0.5}>
          <Typography component="h3" variant="subtitle2">
            Book updates
          </Typography>
          <List dense disablePadding>
            {actions.map(function renderUpdateAction(action) {
              return <UpdateActionItems key={action.kind} action={action} />
            })}
          </List>
        </Stack>
      )}
      <Stack spacing={0.5}>
        <Typography component="h3" variant="subtitle2">
          Downloaded file
        </Typography>
        <List dense disablePadding>
          <UpdateListItem>
            Replace the downloaded file on this device with the result.
          </UpdateListItem>
        </List>
      </Stack>
    </Stack>
  )
}

export async function confirmApplyLocalUpdate(
  actions: WebArchiveUpdateAction[],
): Promise<boolean> {
  return showConfirmDialog({
    title: "Before updating the book...",
    message: <ApplyUpdateMessage actions={actions} />,
    actions: [{ title: "Update book" }],
  })
}
