import { identifierValue } from "@prose-reader/archive-reader"
import type { FileInspection } from "../../useFileInspection"
import type { MetadataFixerFormValues } from "../formValues"

export const resolveMetadataFixerFormValues = (
  inspection: FileInspection,
): MetadataFixerFormValues => ({
  isbn:
    identifierValue(inspection.resolvedArchive.metadata.identifiers, "ISBN") ??
    "",
})
