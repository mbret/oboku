export const asError = (e: unknown) => {

  return {
    message: hasMessage(e) ? e.message : ``
  }
}

const hasMessage = <MessageError extends { message: string }>(e: MessageError | unknown): e is MessageError => {
  return `message` in (e as any) && typeof (e as any).message === `string`
}