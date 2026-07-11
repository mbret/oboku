export const createBroadcast = <TMessage>(name: string) => {
  const channel = new BroadcastChannel(name)

  return {
    broadcast: (message: TMessage) => {
      channel.postMessage(message)
    },
    subscribe: (onMessage: (message: TMessage) => void) => {
      const handleMessage = (event: MessageEvent<TMessage>) => {
        onMessage(event.data)
      }

      channel.addEventListener("message", handleMessage)

      return function unsubscribe() {
        channel.removeEventListener("message", handleMessage)
      }
    },
  }
}
