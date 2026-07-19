export type FromLocationState = {
  from: string
}

export const isFromLocationState = (
  state: unknown,
): state is FromLocationState =>
  typeof state === "object" &&
  state !== null &&
  "from" in state &&
  typeof (state as { from: unknown }).from === "string"
