import { useEffect, useState, type ReactNode } from "react"
import { useMutation } from "@tanstack/react-query"
import { useLiveRef } from "reactjrx"
import { BehaviorSubject, type Observable } from "rxjs"
import type { LinkDocType } from "@oboku/shared"
import { CancelError } from "../errors/errors.shared"
import { PluginUpsertFile } from "./PluginUpsertFile"

type UpsertFileVariables = {
  link: LinkDocType
  file: Blob | File
  fileName: string
  contentType?: string
}

type Pending = UpsertFileVariables & {
  abortController: AbortController
  progress$: BehaviorSubject<number>
  handleProgress: (value: number) => void
  resolve: () => void
  reject: (error: Error) => void
}

const SCOPE_ID = "plugin-upsert-file"

export const usePluginUpsertFile = () => {
  const [pending, setPending] = useState<Pending | null>(null)
  const pendingRef = useLiveRef(pending)

  useEffect(
    () => () => {
      const inFlight = pendingRef.current
      if (!inFlight) return
      inFlight.abortController.abort()
      inFlight.progress$.complete()
      inFlight.reject(new CancelError())
    },
    [pendingRef],
  )

  const mutation = useMutation({
    scope: { id: SCOPE_ID },
    mutationFn: async (variables: UpsertFileVariables) => {
      const abortController = new AbortController()
      const progress$ = new BehaviorSubject(0)
      const handleProgress = (value: number) => progress$.next(value)

      try {
        await new Promise<void>((resolve, reject) => {
          setPending({
            ...variables,
            abortController,
            progress$,
            handleProgress,
            resolve,
            reject,
          })
        })
      } finally {
        abortController.abort()
        progress$.complete()
        setPending(null)
      }
    },
  })

  const slot: ReactNode = pending ? (
    <PluginUpsertFile
      link={pending.link}
      file={pending.file}
      fileName={pending.fileName}
      contentType={pending.contentType}
      signal={pending.abortController.signal}
      onProgress={pending.handleProgress}
      onSuccess={pending.resolve}
      onError={(error) =>
        pending.reject(
          error instanceof Error ? error : new Error(String(error)),
        )
      }
    />
  ) : null

  const progress$: Observable<number> | undefined = pending?.progress$

  return { ...mutation, slot, progress$ }
}
