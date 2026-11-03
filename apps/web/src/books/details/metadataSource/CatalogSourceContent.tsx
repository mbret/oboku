import { Link } from "@mui/material"
import type {
  CatalogMetadata,
  LegacyGoogleBookApiMetadata,
} from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { PageSection } from "../../../common/PageSection"
import { getBookMetadataEntryFields } from "../../metadata/fields"
import { getCatalogProviderName } from "../../metadata/sources"
import { MetadataFieldRow } from "./MetadataFieldRow"
import { BOOK_METADATA_FIELD_LABELS as L } from "./fieldLabels"
import { formatBookMetadataDate, formatList } from "./formatters"

type Props = {
  entry:
    | DeepReadonlyObject<CatalogMetadata | LegacyGoogleBookApiMetadata>
    | undefined
}

/** Read-only content of the catalog record matched to the book. */
export const CatalogSourceContent = ({ entry }: Props) => {
  const fields = entry ? getBookMetadataEntryFields(entry) : undefined

  return (
    <PageSection title="Fields" dense>
      <MetadataFieldRow
        label="Catalog"
        value={entry ? getCatalogProviderName(entry) : undefined}
      />
      <MetadataFieldRow label={L.title} value={fields?.title?.toString()} />
      <MetadataFieldRow label={L.authors} value={formatList(fields?.authors)} />
      <MetadataFieldRow label={L.description} value={fields?.description} />
      <MetadataFieldRow
        label={L.formatType}
        value={formatList(fields?.formatType)}
      />
      <MetadataFieldRow
        label={L.rating}
        value={fields?.rating !== undefined ? `${fields.rating}` : undefined}
      />
      <MetadataFieldRow
        label={L.coverLink}
        value={
          fields?.coverLink ? (
            <Link
              href={fields.coverLink}
              target="_blank"
              rel="noopener noreferrer"
              title={fields.coverLink}
            >
              Open image
            </Link>
          ) : undefined
        }
      />
      <MetadataFieldRow
        label={L.pageCount}
        value={
          fields?.pageCount !== undefined ? `${fields.pageCount}` : undefined
        }
      />
      <MetadataFieldRow
        label={L.date}
        value={formatBookMetadataDate(fields?.date)}
      />
      <MetadataFieldRow label={L.publisher} value={fields?.publisher} />
      <MetadataFieldRow
        label={L.languages}
        value={formatList(fields?.languages)}
      />
      <MetadataFieldRow
        label={L.subjects}
        value={formatList(fields?.subjects)}
      />
    </PageSection>
  )
}
