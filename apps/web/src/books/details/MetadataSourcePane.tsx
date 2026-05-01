import {
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  Typography,
  styled,
} from "@mui/material"
import {
  ChevronRightRounded,
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
  LocalOfferOutlined,
} from "@mui/icons-material"
import { Fragment, type ReactNode, useMemo } from "react"
import { Link } from "react-router"
import { BOOK_METADATA_FIELDS_BY_SOURCE, directives } from "@oboku/shared"
import { useBook } from "../states"
import { useLink } from "../../links/states"
import { pluginsByType } from "../../plugins/configure"
import { ROUTES } from "../../navigation/routes"
import {
  type BookMetadataSource,
  type ReorderableBookMetadataSource,
  DEFAULT_REORDERABLE_BOOK_METADATA_SOURCES,
  getBookMetadataSourceIcon,
  getBookMetadataSourceLabel,
  getOrderedBookMetadataSources,
  isReorderableBookMetadataSource,
} from "../metadata/sources"
import { formatBookMetadataField } from "./metadataSource/formatters"
import { useIncrementalBookPatch } from "../useIncrementalBookPatch"

// Cast preserves Typography's polymorphic `component` prop, which MUI's
// `styled` otherwise erases.
const PluginNameTypography = styled(Typography)(({ theme }) => ({
  marginLeft: theme.spacing(1),
})) as typeof Typography

const WarningTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.warning.main,
})) as typeof Typography

const TrailingIconStack = styled(Stack)({
  width: 50,
  alignItems: "center",
  flexShrink: 0,
})

/**
 * Width of the leading column reserved for the reorder buttons. Applied
 * as left padding on every {@link ListItemButton} so source icons and
 * labels line up across rows whether or not the row is reorderable.
 */
const LEADING_COLUMN_WIDTH = 36

/**
 * Vertical stepper of up/down reorder buttons, overlaid on top of the
 * row's {@link ListItemButton} via absolute positioning. Sitting on top
 * (rather than as a flex sibling) lets the underlying `ListItemButton`
 * span the entire row, so its native `:hover` background paints behind
 * the buttons too — no manual hover plumbing required.
 *
 * The icon buttons themselves remain interactive (clicking them does not
 * fall through to the link), and `:hover` is cursor-position based, so
 * hovering an icon button still paints the row's hover background
 * underneath because the cursor is inside the `ListItemButton`'s
 * bounding box.
 */
const ReorderActionsStack = styled(Stack)({
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: LEADING_COLUMN_WIDTH,
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
})

// Cast preserves ListItemButton's polymorphic `component` prop (used to
// render as a react-router `Link`), which MUI's `styled` otherwise erases.
const RowListItemButton = styled(ListItemButton)({
  paddingLeft: LEADING_COLUMN_WIDTH,
}) as typeof ListItemButton

// Tighten the default IconButton padding so two buttons stack vertically
// without inflating the row height beyond a normal `dense` list row.
//
// Override MUI's default `pointer-events: none` on the disabled state so
// clicks on a disabled arrow are absorbed by the button itself instead
// of falling through to the underlying link (the row's `ListItemButton`
// sits beneath this absolutely-positioned overlay). The native
// `<button disabled>` still won't fire `click`, so this is purely a
// hit-testing fix — the no-op stays a no-op.
const ReorderIconButton = styled(IconButton)({
  padding: 2,
  "&.Mui-disabled": {
    pointerEvents: "auto",
  },
})

/**
 * Number of preview samples shown in the caption row. Captures intent:
 * if a caller passes a five-deep preference list, only the top non-empty
 * two are shown — anything below is "..." territory.
 */
const SAMPLE_PREVIEW_LIMIT = 2

/**
 * Shared "secondary" rendering for every row in the metadata sources
 * list. Behaves identically across sources and the synthetic directives
 * row — only the empty-state copy is per-row.
 *
 * `sampleValues` is treated as a preference-ordered list: empties are
 * dropped and the first {@link SAMPLE_PREVIEW_LIMIT} remaining values
 * are shown as a `value, value, ...` preview. This way each row can
 * pass a deep fallback list (e.g. `[title, authors, isbn, publisher]`)
 * without worrying about which fields are populated.
 */
type SourceRowSecondaryProps = {
  count: number
  sampleValues: ReadonlyArray<string | number | undefined>
  emptyMessage: string
}

function SourceRowSecondary({
  count,
  sampleValues,
  emptyMessage,
}: SourceRowSecondaryProps) {
  if (count === 0) {
    return <WarningTypography variant="body2">{emptyMessage}</WarningTypography>
  }

  const nonEmptyValues = sampleValues.filter(
    (value): value is string | number =>
      value !== undefined && value !== null && value !== "",
  )
  const visibleValues = nonEmptyValues.slice(0, SAMPLE_PREVIEW_LIMIT)
  const hasOverflow = visibleValues.length < nonEmptyValues.length

  return (
    <Stack>
      <Typography variant="body2">{count} properties</Typography>
      <Typography variant="caption">
        {visibleValues.join(", ")}
        {hasOverflow ? ", …" : ""}
      </Typography>
    </Stack>
  )
}

const SECONDARY_SLOT_PROPS = { secondary: { component: "div" } } as const

/**
 * Shared row shell for every entry in the metadata sources list. Owns
 * the `<ListItem><RowListItemButton/></ListItem>` shape, the chevron,
 * and the count/preview rendering — call sites only supply the
 * source-specific bits (icon, label, link target, preview values).
 *
 * Optional `overlay` children are rendered as siblings of the
 * `RowListItemButton` (so they can be absolutely positioned on top
 * without nesting interactive elements). Used for the reorder controls
 * on swappable rows.
 */
type SourceRowProps = {
  to: string
  icon: ReactNode
  primary: ReactNode
  count: number
  sampleValues: ReadonlyArray<string | number | undefined>
  emptyMessage: string
  overlay?: ReactNode
}

function SourceRow({
  to,
  icon,
  primary,
  count,
  sampleValues,
  emptyMessage,
  overlay,
}: SourceRowProps) {
  return (
    <ListItem disablePadding>
      <RowListItemButton component={Link} to={to}>
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText
          primary={primary}
          secondary={
            <SourceRowSecondary
              count={count}
              sampleValues={sampleValues}
              emptyMessage={emptyMessage}
            />
          }
          slotProps={SECONDARY_SLOT_PROPS}
        />
        <TrailingIconStack>
          <ChevronRightRounded />
        </TrailingIconStack>
      </RowListItemButton>
      {overlay}
    </ListItem>
  )
}

const buildSourceRoute = (bookId: string, source: string) =>
  ROUTES.BOOK_METADATA_SOURCE.replace(":id", bookId).replace(":source", source)

/**
 * Synthetic row in the metadata sources list. Directives are not a real
 * metadata variant — they live inside the link's filename and are parsed
 * on the fly. This row exists so the user can discover them and see they
 * sit just below "user" in the merge priority. Clicking jumps to the
 * link source detail screen, where directives are surfaced.
 */
type DirectivesRowProps = {
  bookId: string
  linkTitle: string | number | undefined
}

function DirectivesRow({ bookId, linkTitle }: DirectivesRowProps) {
  const parsed = useMemo(
    () =>
      linkTitle
        ? directives.extractDirectivesFromName(linkTitle.toString())
        : undefined,
    [linkTitle],
  )

  const detectedValues = [parsed?.isbn, parsed?.googleVolumeId].filter(
    (value): value is string => Boolean(value),
  )

  return (
    <SourceRow
      to={buildSourceRoute(bookId, "link")}
      icon={<LocalOfferOutlined />}
      primary="Directives"
      count={detectedValues.length}
      sampleValues={detectedValues}
      emptyMessage="No directives in filename"
    />
  )
}

/**
 * Reorder controls for a swappable source row. Rendered as an absolute
 * overlay on top of the row's {@link RowListItemButton} (which extends
 * under the leading column thanks to its left padding). The icon
 * buttons are siblings of the underlying anchor in the DOM — never
 * nested inside it — so HTML stays valid; clicks land on the icon
 * button without bubbling navigation, while the row's hover background
 * still paints behind the buttons because `:hover` fires whenever the
 * cursor is inside the `ListItemButton`'s bounding box.
 */
type SourceReorderActionsProps = {
  source: ReorderableBookMetadataSource
  middle: ReadonlyArray<ReorderableBookMetadataSource>
  onChange: (next: ReorderableBookMetadataSource[]) => void
}

function SourceReorderActions({
  source,
  middle,
  onChange,
}: SourceReorderActionsProps) {
  const index = middle.indexOf(source)
  const canMoveUp = index > 0
  const canMoveDown = index >= 0 && index < middle.length - 1

  const swap = (a: number, b: number) => {
    const aValue = middle[a]
    const bValue = middle[b]
    if (aValue === undefined || bValue === undefined) return

    const next = middle.map((source, i) => {
      if (i === a) return bValue
      if (i === b) return aValue

      return source
    })

    onChange(next)
  }

  return (
    <ReorderActionsStack>
      <ReorderIconButton
        edge={false}
        size="small"
        disabled={!canMoveUp}
        onClick={() => swap(index, index - 1)}
        aria-label={`Move ${getBookMetadataSourceLabel(source)} up`}
      >
        <KeyboardArrowUpRounded fontSize="small" />
      </ReorderIconButton>
      <ReorderIconButton
        edge={false}
        size="small"
        disabled={!canMoveDown}
        onClick={() => swap(index, index + 1)}
        aria-label={`Move ${getBookMetadataSourceLabel(source)} down`}
      >
        <KeyboardArrowDownRounded fontSize="small" />
      </ReorderIconButton>
    </ReorderActionsStack>
  )
}

export function MetadataSourcePane({ bookId }: { bookId: string }) {
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })
  const plugin = link?.type ? pluginsByType[link?.type] : undefined
  const linkTitle = book?.metadata?.find((item) => item.type === "link")?.title
  const { mutate: incrementalBookPatch } = useIncrementalBookPatch()

  const orderedSources: BookMetadataSource[] = useMemo(
    () => getOrderedBookMetadataSources(book?.metadataSourcePriority),
    [book?.metadataSourcePriority],
  )

  // Sanitized middle subset, used by the reorder controls so they always
  // operate on a known-good list (matches what the merge actually uses).
  const middle = useMemo(
    () => orderedSources.filter(isReorderableBookMetadataSource),
    [orderedSources],
  )

  const handleReorder = (next: ReorderableBookMetadataSource[]) => {
    if (!bookId) return

    // Drop the patch when it matches the default — keeps the document
    // free of redundant fields and lets the default ever evolve without
    // existing books overriding it.
    const matchesDefault =
      next.length === DEFAULT_REORDERABLE_BOOK_METADATA_SOURCES.length &&
      next.every((s, i) => s === DEFAULT_REORDERABLE_BOOK_METADATA_SOURCES[i])

    incrementalBookPatch({
      doc: bookId,
      patch: { metadataSourcePriority: matchesDefault ? undefined : next },
    })
  }

  return (
    <List
      dense
      subheader={<ListSubheader>Metadata Sources</ListSubheader>}
      disablePadding
    >
      <ListItem>
        <ListItemText secondary="Ordered by display priority. Use the arrows to swap File and Google Book API." />
      </ListItem>
      {orderedSources.map((source) => {
        const metadata = book?.metadata?.find((item) => item.type === source)

        // `type` is the variant discriminator, not a real property.
        const numberOfProperties = metadata
          ? Object.entries(metadata).filter(
              ([key, value]) => key !== "type" && value !== undefined,
            ).length
          : 0

        // Drive the preview from the source's declared field list so the
        // caption can never go blank while `numberOfProperties` is non-zero
        // (which would happen if every populated field sat outside a
        // hard-coded preview list).
        const sampleValues = BOOK_METADATA_FIELDS_BY_SOURCE[source].map(
          (field) => formatBookMetadataField(metadata, field),
        )

        const reorderable = isReorderableBookMetadataSource(source)

        return (
          <Fragment key={source}>
            <SourceRow
              to={buildSourceRoute(bookId, source)}
              icon={getBookMetadataSourceIcon(source)}
              primary={
                <Typography>
                  {getBookMetadataSourceLabel(source)}
                  {source === "link" && (
                    <PluginNameTypography component="span" variant="body2">
                      ({plugin?.name})
                    </PluginNameTypography>
                  )}
                </Typography>
              }
              count={numberOfProperties}
              sampleValues={sampleValues}
              emptyMessage={
                source === "user" ? "No information entered yet" : "No data yet"
              }
              overlay={
                reorderable ? (
                  <SourceReorderActions
                    source={source}
                    middle={middle}
                    onChange={handleReorder}
                  />
                ) : undefined
              }
            />
            {source === "user" && (
              <DirectivesRow bookId={bookId} linkTitle={linkTitle} />
            )}
          </Fragment>
        )
      })}
    </List>
  )
}
