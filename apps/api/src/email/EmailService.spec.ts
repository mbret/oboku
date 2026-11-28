import { Readable } from "node:stream"
import { Test, type TestingModule } from "@nestjs/testing"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { AppConfigService } from "../config/AppConfigService.js"
import { EmailService, getEmailSenderAddress } from "./EmailService.js"
import { readAttachment, startSmtpServer } from "./smtpServer.fixture.js"

const SENDER_ADDRESS = "books@oboku.example"
const BOOK_BYTES = Buffer.from("epub bytes ".repeat(2000))

const createConfig = (
  port: number,
): Pick<
  AppConfigService,
  | "NODE_ENV"
  | "EMAIL_SMTP_HOST"
  | "EMAIL_SMTP_PORT"
  | "EMAIL_SMTP_USER"
  | "EMAIL_SMTP_PASSWORD"
  | "EMAIL_FROM"
  | "EMAIL_FROM_NAME"
  | "EMAIL_SMTP_MAX_SEND_RATE"
  | "EMAIL_SMTP_SOCKET_TIMEOUT_MS"
  | "APP_PUBLIC_URL"
> => ({
  NODE_ENV: "production",
  EMAIL_SMTP_HOST: "127.0.0.1",
  EMAIL_SMTP_PORT: port,
  EMAIL_SMTP_USER: undefined,
  EMAIL_SMTP_PASSWORD: undefined,
  EMAIL_FROM: SENDER_ADDRESS,
  EMAIL_FROM_NAME: "oboku",
  EMAIL_SMTP_MAX_SEND_RATE: undefined,
  EMAIL_SMTP_SOCKET_TIMEOUT_MS: 20_000,
  APP_PUBLIC_URL: "https://app.oboku.example",
})

describe("getEmailSenderAddress", () => {
  it("is the sender address once the SMTP host and the address are set", () => {
    expect(
      getEmailSenderAddress({
        EMAIL_SMTP_HOST: "smtp.example",
        EMAIL_FROM: SENDER_ADDRESS,
      }),
    ).toBe(SENDER_ADDRESS)
  })

  it.each([
    { EMAIL_SMTP_HOST: undefined, EMAIL_FROM: SENDER_ADDRESS },
    { EMAIL_SMTP_HOST: "smtp.example", EMAIL_FROM: undefined },
  ])("is none for $EMAIL_SMTP_HOST and $EMAIL_FROM", (config) => {
    expect(getEmailSenderAddress(config)).toBeUndefined()
  })
})

describe("EmailService attachments", () => {
  let smtpServer: Awaited<ReturnType<typeof startSmtpServer>>
  let module: TestingModule
  let emailService: EmailService

  beforeEach(async () => {
    smtpServer = await startSmtpServer()
    module = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: AppConfigService,
          useValue: createConfig(smtpServer.port),
        },
      ],
    }).compile()
    emailService = module.get(EmailService)
  })

  afterEach(async () => {
    await module.close()
    await smtpServer.close()
  })

  it("emails a stream as an attachment, with its name, its type and every byte", async () => {
    await emailService.sendEmail({
      to: "reader@kindle.com",
      subject: "A book",
      text: "Here is a book.",
      attachments: [
        {
          filename: "Dune.epub",
          contentType: "application/epub+zip",
          content: Readable.from([
            BOOK_BYTES.subarray(0, 100),
            BOOK_BYTES.subarray(100),
          ]),
        },
      ],
    })

    const [email] = smtpServer.receivedEmails

    if (!email) throw new Error("The SMTP server received no email")

    const attachment = readAttachment(email)

    expect(email.from).toBe(SENDER_ADDRESS)
    expect(email.recipients).toEqual(["reader@kindle.com"])
    expect(attachment.headers).toContain("application/epub+zip")
    expect(attachment.headers).toContain("filename=Dune.epub")
    expect(attachment.content.equals(BOOK_BYTES)).toBe(true)
  })

  it("fails with the stream's error, and sends no email, when the stream fails", async () => {
    const streamFailure = new Error("The source stopped")
    const failingContent = Readable.from(
      (async function* yieldThenFail() {
        yield BOOK_BYTES.subarray(0, 100)

        throw streamFailure
      })(),
    )

    await expect(
      emailService.sendEmail({
        to: "reader@kindle.com",
        subject: "A book",
        text: "Here is a book.",
        attachments: [
          {
            filename: "Dune.epub",
            contentType: "application/epub+zip",
            content: failingContent,
          },
        ],
      }),
    ).rejects.toBe(streamFailure)

    expect(smtpServer.receivedEmails).toEqual([])
  })
})
