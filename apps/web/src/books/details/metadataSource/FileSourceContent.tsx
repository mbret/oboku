import type { FileMetadata, LegacyFileMetadata } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { PageSection } from "../../../common/PageSection"
import { getBookMetadataEntryFields } from "../../metadata/fields"
import { MetadataFieldRow } from "./MetadataFieldRow"
import { BOOK_METADATA_FIELD_LABELS as L } from "./fieldLabels"
import {
  formatBookMetadataDate,
  formatCoverConfidence,
  formatList,
} from "./formatters"

type Props = {
  entry: DeepReadonlyObject<FileMetadata | LegacyFileMetadata> | undefined
}

export const FileSourceContent = ({ entry }: Props) => {
  const fields = entry ? getBookMetadataEntryFields(entry) : undefined

  return (
    <PageSection title="Fields" dense>
      <MetadataFieldRow label={L.title} value={fields?.title?.toString()} />
      <MetadataFieldRow label={L.authors} value={formatList(fields?.authors)} />
      <MetadataFieldRow label={L.publisher} value={fields?.publisher} />
      <MetadataFieldRow label={L.rights} value={fields?.rights} />
      <MetadataFieldRow
        label={L.languages}
        value={formatList(fields?.languages)}
      />
      <MetadataFieldRow
        label={L.date}
        value={formatBookMetadataDate(fields?.date)}
      />
      <MetadataFieldRow
        label={L.subjects}
        value={formatList(fields?.subjects)}
      />
      <MetadataFieldRow label={L.coverLink} value={fields?.coverLink} />
      <MetadataFieldRow
        label={L.coverConfidence}
        value={formatCoverConfidence(fields?.coverConfidence)}
      />
      <MetadataFieldRow
        label={L.pageCount}
        value={
          fields?.pageCount !== undefined ? `${fields.pageCount}` : undefined
        }
      />
      <MetadataFieldRow label={L.contentType} value={fields?.contentType} />
      <MetadataFieldRow label={L.isbn} value={fields?.isbn} />
      <MetadataFieldRow
        label={L.googleVolumeId}
        value={fields?.googleVolumeId}
      />
    </PageSection>
  )
}
