import {
  CONVERTIBLE_IMAGE_FORMAT_NAMES,
  PRESERVABLE_IMAGE_FORMAT_NAMES,
  type WebArchiveUpdateAction,
} from "@oboku/archive-metadata/web"
import { FiberManualRecord } from "@mui/icons-material"
import {
  List,
  ListItem,
  ListItemIcon,
  Stack,
  Typography,
  styled,
} from "@mui/material"
import { Fragment, type ReactNode } from "react"
import { showConfirmDialog } from "../../../common/dialogs/presets"
import { KeyChip } from "../KeyChip"
import {
  CONTAINER_LABELS,
  identifierDestinations,
} from "../metadata/identifiers/containers"
import { identifierSchemeLabel } from "../metadata/identifiers/schemes"

const BulletListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  minWidth: theme.spacing(3),
  fontSize: theme.typography.pxToRem(7),
}))

const UpdateContentStack = styled(Stack)({
  flex: 1,
  minWidth: 0,
})

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

type PatchMetadataAction = Extract<
  WebArchiveUpdateAction,
  { kind: "patch-metadata" }
>

const patchedContainerLabels = ({ targets }: PatchMetadataAction): string[] => {
  const labels: string[] = []

  if (targets.comicInfo) labels.push(CONTAINER_LABELS.comicInfo)
  if (targets.opf) labels.push(CONTAINER_LABELS.opf)

  return labels
}

function MetadataUpdateItems({ action }: { action: PatchMetadataAction }) {
  const containers = patchedContainerLabels(action)
  const destinations = identifierDestinations(
    action.patch.identifiers,
    action.targets,
  )

  if (action.patch.identifiers.length === 0) {
    return (
      <UpdateListItem>
        Remove every identifier from{" "}
        <MetadataTargetChips targets={containers} />.
      </UpdateListItem>
    )
  }

  return (
    <>
      {action.patch.identifiers.map(
        function renderIdentifierUpdate(identifier, index) {
          const storedIn = (destinations[index] ?? []).map(
            function toContainerLabel(container) {
              return CONTAINER_LABELS[container]
            },
          )
          const schemeLabel = identifierSchemeLabel(identifier.scheme)

          return storedIn.length === 0 ? (
            <UpdateListItem key={`${identifier.scheme}:${identifier.value}`}>
              Drop <KeyChip label={schemeLabel} />{" "}
              <KeyChip label={identifier.value} />: no container in this book
              can carry it.
            </UpdateListItem>
          ) : (
            <UpdateListItem key={`${identifier.scheme}:${identifier.value}`}>
              Set <KeyChip label={schemeLabel} /> to{" "}
              <KeyChip label={identifier.value} /> in{" "}
              <MetadataTargetChips targets={storedIn} />.
            </UpdateListItem>
          )
        },
      )}
      <UpdateListItem>
        Remove any other identifier from{" "}
        <MetadataTargetChips targets={containers} />.
      </UpdateListItem>
    </>
  )
}

function ImageResizeUpdateItem({
  maxWidth,
  maxHeight,
  formats,
}: {
  maxWidth: number | undefined
  maxHeight: number | undefined
  formats: string
}) {
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
  const keepsOriginalFormat = action.config.outputMode === "original"
  const formats = (
    keepsOriginalFormat
      ? PRESERVABLE_IMAGE_FORMAT_NAMES
      : CONVERTIBLE_IMAGE_FORMAT_NAMES
  ).join(" · ")
  const convertedFormat = action.config.outputMode === "avif" ? "AVIF" : "WebP"

  return (
    <>
      <ImageResizeUpdateItem {...action.config} formats={formats} />
      {keepsOriginalFormat ? (
        <>
          <UpdateListItem>
            Keep each resized image in its original format.
          </UpdateListItem>
          <UpdateListItem>
            Leave all other image formats unchanged.
          </UpdateListItem>
        </>
      ) : (
        <>
          <UpdateListItem>
            Convert <KeyChip label={formats} /> images to{" "}
            <KeyChip label={convertedFormat} />.
          </UpdateListItem>
          <UpdateListItem>
            Update references to converted images.
          </UpdateListItem>
        </>
      )}
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
