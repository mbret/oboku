export const toProgressRatioHandler = (
  onProgress: ((progress: number) => void) | undefined,
) =>
  onProgress
    ? (event: ProgressEvent<EventTarget>) => {
        if (!event.lengthComputable || event.total === 0) return

        onProgress(event.loaded / event.total)
      }
    : undefined
