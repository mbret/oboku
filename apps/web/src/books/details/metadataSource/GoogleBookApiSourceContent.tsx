import { List, ListSubheader } from "@mui/material"
import type { GoogleBookApiMetadata } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { MetadataFieldRow } from "./MetadataFieldRow"
import { BOOK_METADATA_FIELD_LABELS as L } from "./fieldLabels"
import { formatBookMetadataDate, formatList } from "./formatters"

type Props = {
  metadata: DeepReadonlyObject<GoogleBookApiMetadata> | undefined
}

/**
 * Read-only content fetched from the Google Books API. The advertised
 * fields mirror what `parseGoogleMetadata` extracts from a volume entry.
 */
export const GoogleBookApiSourceContent = ({ metadata }: Props) => (
  <List dense subheader={<ListSubheader disableGutters>Fields</ListSubheader>}>
    <MetadataFieldRow label={L.title} value={metadata?.title?.toString()} />
    <MetadataFieldRow label={L.authors} value={formatList(metadata?.authors)} />
    <MetadataFieldRow label={L.description} value={metadata?.description} />
    <MetadataFieldRow
      label={L.formatType}
      value={formatList(metadata?.formatType)}
    />
    <MetadataFieldRow
      label={L.rating}
      value={metadata?.rating !== undefined ? `${metadata.rating}` : undefined}
    />
    <MetadataFieldRow label={L.coverLink} value={metadata?.coverLink} />
    <MetadataFieldRow
      label={L.pageCount}
      value={
        metadata?.pageCount !== undefined ? `${metadata.pageCount}` : undefined
      }
    />
    <MetadataFieldRow
      label={L.date}
      value={formatBookMetadataDate(metadata?.date)}
    />
    <MetadataFieldRow label={L.publisher} value={metadata?.publisher} />
    <MetadataFieldRow
      label={L.languages}
      value={formatList(metadata?.languages)}
    />
    <MetadataFieldRow
      label={L.subjects}
      value={formatList(metadata?.subjects)}
    />
  </List>
)
