interface Async {
  (format: 'string' | 'base64'): Promise<string>
  (format: 'blob'): Promise<Blob>
}

export type Archive = {
  files: {
    dir: boolean
    name: string
    async: Async
    size: number
  }[]
}