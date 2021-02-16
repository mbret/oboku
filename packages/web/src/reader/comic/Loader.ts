import JSZip from 'jszip'
import '../../archive'
import { sortByTitleComparator } from '@oboku/shared/dist/sorts'
import './style.css'

type LoadableFile = { name: string }

abstract class Loaded {
  constructor(public files: LoadableFile[]) { }

  abstract getFile(filenam: string): Promise<string | undefined>

  abstract getType(): 'comic' | 'file'
}

class LoadedJSZip extends Loaded {
  constructor(public files: LoadableFile[], public jszip: JSZip) {
    super(files)
  }

  public async getFile(filename: string) {
    return await this.jszip.file(filename)?.async('base64')
  }

  public getType() {
    return 'comic' as const
  }
}

class LoadedRAR extends Loaded {
  constructor(public files: (LoadableFile & { readData: any })[]) {
    super(files)
  }

  public async getFile(filename: string) {
    const file = this.files.find(file => file.name === filename)
    if (!file) throw new Error('File not found')
    return await new Promise<string>((resolve, reject) => {
      file.readData((data: ArrayBuffer, error) => {
        if (error) return reject(error)
        var binary = '';
        var bytes = new Uint8Array(data);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const b64data = window.btoa(binary)
        resolve(b64data)
      })
    })
  }

  public getType() {
    return 'comic' as const
  }
}

class LoadedFile extends Loaded {
  constructor(public files: LoadableFile[], public data: Blob | File) {
    super(files)
  }

  public async getFile(filename: string) {
    return await this.data.text()
  }

  public getType() {
    return 'file' as const
  }
}

export const load = async (data: Blob | File) => {
  if (['text/xml'].includes(data.type)
    || (data instanceof File && (data.name.endsWith('.txt')))
  ) {
    const files = [{ name: data instanceof File ? data.name : 'unknown' }]
    return new LoadedFile(files, data)
  }

  if (data instanceof Blob) {
    const archive = await new Promise<any>((resolve, reject) => {
      try {
        // @ts-ignore
        loadArchiveFormats(['rar'], () => {
          // @ts-ignore
          archiveOpenFile(data, undefined, (archive, err) => {
            if (err) return reject(err)
            resolve(archive)
          })
        })
      } catch (e) {
        return reject(e)
      }
    })

    if (archive.archive_type === 'rar') {
      return new LoadedRAR(archive.entries)
    } else {
      const jszip = archive as JSZip
      const filesAsArray = Object.values(jszip.files).filter(file => !file.dir)
      const sortedKeys = filesAsArray.map(f => f.name).sort(sortByTitleComparator)
      const files = sortedKeys
        .map(name => {
          const file = filesAsArray.find(f => f.name === name) as JSZip.JSZipObject

          return {
            name: file.name
          }
        })

      return new LoadedJSZip(files, jszip)
    }
  } else {
    throw new Error('Invalid format')
  }
}