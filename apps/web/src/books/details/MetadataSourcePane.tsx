import {
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
import { ChevronRightRounded, LocalOfferOutlined } from "@mui/icons-material"
import { Fragment, type FC, useMemo } from "react"
import { Link } from "react-router"
import { BOOK_METADATA_FIELDS_BY_SOURCE, directives } from "@oboku/shared"
import { useBook } from "../states"
import { useLink } from "../../links/states"
import { pluginsByType } from "../../plugins/configure"
import { ROUTES } from "../../navigation/routes"
import {
  BOOK_METADATA_SOURCES,
  getBookMetadataSourceIcon,
  getBookMetadataSourceLabel,
} from "../metadata/sources"
import { formatBookMetadataField } from "./metadataSource/formatters"

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
const SourceRowSecondary: FC<{
  count: number
  sampleValues: ReadonlyArray<string | number | undefined>
  emptyMessage: string
}> = ({ count, sampleValues, emptyMessage }) => {
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
 * Synthetic row in the metadata sources list. Directives are not a real
 * metadata variant — they live inside the link's filename and are parsed
 * on the fly. This row exists so the user can discover them and see they
 * sit just below "user" in the merge priority. Clicking jumps to the
 * link source detail screen, where directives are surfaced.
 */
const DirectivesRow: FC<{
  bookId: string
  linkTitle: string | number | undefined
}> = ({ bookId, linkTitle }) => {
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
    <ListItemButton
      component={Link}
      to={ROUTES.BOOK_METADATA_SOURCE.replace(":id", bookId).replace(
        ":source",
        "link",
      )}
    >
      <ListItemIcon>
        <LocalOfferOutlined />
      </ListItemIcon>
      <ListItemText
        primary="Directives"
        secondary={
          <SourceRowSecondary
            count={detectedValues.length}
            sampleValues={detectedValues}
            emptyMessage="No directives in filename"
          />
        }
        slotProps={SECONDARY_SLOT_PROPS}
      />
      <TrailingIconStack>
        <ChevronRightRounded />
      </TrailingIconStack>
    </ListItemButton>
  )
}

export const MetadataSourcePane: FC<{ bookId: string }> = ({ bookId }) => {
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })
  const plugin = link?.type ? pluginsByType[link?.type] : undefined
  const linkTitle = book?.metadata?.find((item) => item.type === "link")?.title

  return (
    <List
      dense
      subheader={<ListSubheader>Metadata Sources</ListSubheader>}
      disablePadding
    >
      <ListItem>
        <ListItemText secondary="Ordered by display priority" />
      </ListItem>
      {BOOK_METADATA_SOURCES.map((source) => {
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

        return (
          <Fragment key={source}>
            <ListItemButton
              component={Link}
              to={ROUTES.BOOK_METADATA_SOURCE.replace(":id", bookId).replace(
                ":source",
                source,
              )}
            >
              <ListItemIcon>{getBookMetadataSourceIcon(source)}</ListItemIcon>
              <ListItemText
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
                secondary={
                  <SourceRowSecondary
                    count={numberOfProperties}
                    sampleValues={sampleValues}
                    emptyMessage={
                      source === "user"
                        ? "No information entered yet"
                        : "No data yet"
                    }
                  />
                }
                slotProps={SECONDARY_SLOT_PROPS}
              />
              <TrailingIconStack>
                <ChevronRightRounded />
              </TrailingIconStack>
            </ListItemButton>
            {source === "user" && (
              <DirectivesRow bookId={bookId} linkTitle={linkTitle} />
            )}
          </Fragment>
        )
      })}
    </List>
  )
}
