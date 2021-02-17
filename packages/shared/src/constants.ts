const extensions = ['.epub', '.txt', '.cbz', '.cbr']

export const READER_SUPPORTED_EXTENSIONS = [...extensions, ...extensions.map(e => e.toUpperCase())]
export const METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS = ['application/x-cbz', 'application/epub+zip', 'application/zip']
export const READER_SUPPORTED_MIME_TYPES = ['application/x-cbz', 'application/epub+zip', 'text/xml', 'application/x-cbr', 'application/zip']