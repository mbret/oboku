import { once } from "node:events"
import { type AddressInfo, createServer, type Socket } from "node:net"

export type ReceivedEmail = {
  from: string
  recipients: string[]
  /** The message as sent after `DATA`: its headers, a blank line and its body. */
  data: string
}

const LINE_END = "\r\n"
const DATA_END = `${LINE_END}.${LINE_END}`

const toAddress = (line: string) => line.slice(line.indexOf("<") + 1, -1)

/**
 * The headers and the bytes of the one attachment of an email that nodemailer
 * wrote: it sends attachments as base64 parts.
 */
export const readAttachment = ({ data }: ReceivedEmail) => {
  const boundary = /boundary="([^"]+)"/.exec(data)?.[1]
  const attachmentPart = data
    .split(`--${boundary}`)
    .find((part) => part.includes("Content-Disposition: attachment"))

  if (!attachmentPart) throw new Error("The email has no attachment")

  const [headers = "", ...encodedContent] = attachmentPart.split(
    `${LINE_END}${LINE_END}`,
  )

  return {
    headers,
    content: Buffer.from(encodedContent.join(""), "base64"),
  }
}

/**
 * A local SMTP server that keeps the emails it accepts.
 *
 * @param recipientRefusal the reply to every recipient, such as
 * `550 Mailbox unavailable`: the client then sends no message.
 * @param dataRefusal the reply to every whole message, such as
 * `552 Message too large`.
 */
export const startSmtpServer = async ({
  recipientRefusal,
  dataRefusal,
}: {
  recipientRefusal?: string
  dataRefusal?: string
} = {}) => {
  const receivedEmails: ReceivedEmail[] = []
  const openSockets = new Set<Socket>()

  const server = createServer(function converse(socket) {
    // Imperative on purpose: this is the SMTP conversation's state, which a
    // chunk can advance by several commands.
    let unread = ""
    let isReadingMessage = false
    let from = ""
    let recipients: string[] = []

    const reply = (line: string) => socket.write(`${line}${LINE_END}`)

    const readCommand = (line: string) => {
      const command = line.slice(0, 4).toUpperCase()

      switch (command) {
        case "EHLO":
        case "HELO":
          return reply("250 localhost")
        case "MAIL":
          from = toAddress(line)
          recipients = []

          return reply("250 OK")
        case "RCPT":
          if (recipientRefusal) return reply(recipientRefusal)

          recipients = [...recipients, toAddress(line)]

          return reply("250 OK")
        case "DATA":
          isReadingMessage = true

          return reply("354 End data with <CR><LF>.<CR><LF>")
        case "QUIT":
          reply("221 Bye")

          return socket.end()
        default:
          return reply("250 OK")
      }
    }

    openSockets.add(socket)
    socket.once("close", function forgetSocket() {
      openSockets.delete(socket)
    })
    socket.on("error", function ignoreClientReset() {})
    socket.setEncoding("latin1")
    reply("220 localhost ESMTP")

    socket.on("data", function readChunk(chunk: string) {
      unread += chunk

      while (true) {
        const end = unread.indexOf(isReadingMessage ? DATA_END : LINE_END)

        if (end === -1) return

        if (isReadingMessage) {
          const data = unread.slice(0, end)

          unread = unread.slice(end + DATA_END.length)
          isReadingMessage = false

          if (dataRefusal) {
            reply(dataRefusal)
          } else {
            receivedEmails.push({ from, recipients, data })
            reply("250 OK")
          }
        } else {
          const line = unread.slice(0, end)

          unread = unread.slice(end + LINE_END.length)
          readCommand(line)
        }
      }
    })
  })

  server.listen(0, "127.0.0.1")
  await once(server, "listening")

  // `address()` is an `AddressInfo` for a server that listens on a port.
  const { port } = server.address() as AddressInfo

  return {
    port,
    receivedEmails,
    close: async () => {
      if (!server.listening) return

      for (const socket of openSockets) socket.destroy()

      server.close()
      await once(server, "close")
    },
  }
}
