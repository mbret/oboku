interface Async {
  (format: 'string' | 'base64'): Promise<string>
  (format: 'blob'): Promise<Blob>
}

export type Archive = {
  filename: string,
  files: {
    dir: boolean
    name: string
    blob: () => Promise<Blob>
    string: () => Promise<string>
    base64: () => Promise<string>
    size: number,
    encodingFormat?: undefined | `text/plain`
  }[]
}