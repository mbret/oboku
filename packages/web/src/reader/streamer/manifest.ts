import { Archive, generateManifestResponse as streamerGenerateManifestResponse } from '@oboku/reader-streamer'

export const generateManifestResponse = async (archive: Archive, { baseUrl }: {
  baseUrl: string;
}) => {
  const manifest = await streamerGenerateManifestResponse(archive, { baseUrl })

  if (
    archive.filename.endsWith(`.cbz`)
    || archive.filename.endsWith(`.cbr`)
  ) {
    return manifest
  }

  return manifest
}