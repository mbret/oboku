export type RarArchive = {
  entries: {
    is_file: boolean,
    name: string,
    size_compressed: number,
    size_uncompressed: number,
    readData: (cb: (data: ArrayBuffer, error) => void) => void
  }[]
}