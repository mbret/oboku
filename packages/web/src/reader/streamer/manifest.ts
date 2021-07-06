/**
 * @important
 * Service Worker
 */
import { Archive, getManifestFromArchive } from '@oboku/reader-streamer'

export const generateManifestResponse = async (archive: Archive, { baseUrl }: {
  baseUrl: string;
}) => {
  const manifest = await getManifestFromArchive(archive, { baseUrl })

  if (
    archive.filename.endsWith(`.cbz`)
    || archive.filename.endsWith(`.cbr`)
  ) {
    return manifest
  }

  return manifest
}