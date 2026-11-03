import { memo } from "react"
import type { LinkDocType } from "@oboku/shared"
import { pluginsByType } from "./configure"

type Props = {
  link: LinkDocType
  file: Blob | File
  fileName: string
  contentType?: string
  signal: AbortSignal
  onProgress: (progress: number) => void
  onError: (error: unknown) => void
  onSuccess: () => void
}

export const PluginUpsertFile = memo(function PluginUpsertFile({
  link,
  ...props
}: Props) {
  switch (link.type) {
    case "DRIVE": {
      const { UpsertFileComponent } = pluginsByType.DRIVE
      if (!UpsertFileComponent) break

      return <UpsertFileComponent {...props} link={link} />
    }
    case "dropbox": {
      const { UpsertFileComponent } = pluginsByType.dropbox
      if (!UpsertFileComponent) break

      return <UpsertFileComponent {...props} link={link} />
    }
    case "one-drive": {
      const { UpsertFileComponent } = pluginsByType["one-drive"]
      if (!UpsertFileComponent) break

      return <UpsertFileComponent {...props} link={link} />
    }
    default: {
      break
    }
  }

  throw new Error(`Unsupported link type for upsert: ${link.type}`)
})
