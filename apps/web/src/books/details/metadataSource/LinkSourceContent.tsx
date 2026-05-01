import {
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Stack,
} from "@mui/material"
import { type LinkMetadata, directives, formatBytes } from "@oboku/shared"
import { useMemo } from "react"
import type { DeepReadonlyObject } from "rxdb"
import { MetadataFieldRow } from "./MetadataFieldRow"
import { BOOK_METADATA_FIELD_LABELS } from "./fieldLabels"

type Props = {
  metadata: DeepReadonlyObject<LinkMetadata> | undefined
}

type ParsedDirectives = ReturnType<typeof directives.extractDirectivesFromName>

/**
 * Directives that map onto a {@link BookMetadata} property. Behavior
 * directives (`metadataSourceOnly`, `ignoreMetadataFile`, `isWebtoon`,
 * etc.) are intentionally excluded — they belong on a dedicated
 * filename-directives screen, not on a metadata source detail.
 */
type MetadataDirectiveKey = Extract<
  keyof ParsedDirectives,
  "isbn" | "googleVolumeId"
>

type DirectiveRow = {
  key: MetadataDirectiveKey
  label: string
  value: string
}

const buildDirectiveRows = (
  parsed: ParsedDirectives | undefined,
): DirectiveRow[] => {
  if (!parsed) return []

  const rows: DirectiveRow[] = []
  if (parsed.isbn) rows.push({ key: "isbn", label: "ISBN", value: parsed.isbn })
  if (parsed.googleVolumeId)
    rows.push({
      key: "googleVolumeId",
      label: "Google volume ID",
      value: parsed.googleVolumeId,
    })

  return rows
}

const DirectivesSection = ({
  title,
}: {
  title: string | number | undefined
}) => {
  const parsed = useMemo(
    () =>
      title
        ? directives.extractDirectivesFromName(title.toString())
        : undefined,
    [title],
  )
  const rows = useMemo(() => buildDirectiveRows(parsed), [parsed])

  return (
    <List
      dense
      subheader={
        <ListSubheader disableGutters>Inferred from directives</ListSubheader>
      }
    >
      <ListItem disableGutters>
        <ListItemText
          secondary={
            rows.length
              ? "Values parsed from directives embedded in the filename. Edit the filename in your storage provider to change them."
              : "No directives detected. Add directives like [oboku~isbn~123] to the filename to override or enrich metadata."
          }
        />
      </ListItem>
      {rows.map((row) => (
        <ListItem key={row.key} disableGutters>
          <ListItemText primary={row.label} secondary={row.value} />
        </ListItem>
      ))}
    </List>
  )
}

/**
 * Link source detail. Title is shown in two forms — raw (filename
 * verbatim, directives included) and cleaned — so the user sees what is
 * canonical vs. what other consumers display. Size is humanized.
 * Directive-derived metadata fields are exposed in their own section.
 */
export const LinkSourceContent = ({ metadata }: Props) => {
  const rawTitle = metadata?.title?.toString()
  const cleanTitle = rawTitle
    ? directives.removeDirectiveFromString(rawTitle)
    : undefined

  return (
    <Stack spacing={2}>
      <List
        dense
        subheader={<ListSubheader disableGutters>Fields</ListSubheader>}
      >
        <MetadataFieldRow label="Title (raw)" value={rawTitle} />
        <MetadataFieldRow
          label={BOOK_METADATA_FIELD_LABELS.title}
          value={cleanTitle}
        />
        <MetadataFieldRow
          label={BOOK_METADATA_FIELD_LABELS.contentType}
          value={metadata?.contentType}
        />
        <MetadataFieldRow
          label={BOOK_METADATA_FIELD_LABELS.size}
          value={formatBytes(metadata?.size) ?? metadata?.size}
        />
      </List>
      <DirectivesSection title={metadata?.title} />
    </Stack>
  )
}
