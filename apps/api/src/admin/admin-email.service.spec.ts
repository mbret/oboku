import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common"
import type { EmailService } from "src/email/EmailService"
import type { UserPostgresService } from "src/features/postgres/user-postgres.service"
import { AdminEmailService } from "./admin-email.service"

// setImmediate fires after the microtask queue drains, by which point the
// fire-and-forget background delivery has fully run (mocks resolve synchronously).
const flushBackgroundWork = () =>
  new Promise((resolve) => {
    setImmediate(resolve)
  })

describe("AdminEmailService", () => {
  let sendEmail: jest.Mock
  let verifyTransport: jest.Mock
  let getAllUserEmails: jest.Mock
  let service: AdminEmailService

  beforeEach(() => {
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined)
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined)

    sendEmail = jest.fn().mockResolvedValue(undefined)
    verifyTransport = jest.fn().mockResolvedValue(undefined)
    getAllUserEmails = jest.fn().mockResolvedValue([])

    service = new AdminEmailService(
      { getAllUserEmails } as unknown as UserPostgresService,
      { sendEmail, verifyTransport } as unknown as EmailService,
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("rejects a whitespace-only subject without sending", async () => {
    await expect(
      service.sendBroadcast({
        subject: "   ",
        body: "Hello",
        audienceType: "all",
      }),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(verifyTransport).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("rejects a whitespace-only body without sending", async () => {
    await expect(
      service.sendBroadcast({
        subject: "Hello",
        body: "   ",
        audienceType: "all",
      }),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("rejects a targeted send with no usable emails", async () => {
    await expect(
      service.sendBroadcast({
        subject: "Hello",
        body: "Body",
        audienceType: "emails",
        emails: ["   ", ""],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("rejects when the audience resolves to zero recipients", async () => {
    getAllUserEmails.mockResolvedValue([])

    await expect(
      service.sendBroadcast({
        subject: "Hello",
        body: "Body",
        audienceType: "all",
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("surfaces a transport failure up front and sends nothing", async () => {
    getAllUserEmails.mockResolvedValue(["a@example.com"])
    verifyTransport.mockRejectedValue(
      new InternalServerErrorException(
        "Email delivery is currently unavailable",
      ),
    )

    await expect(
      service.sendBroadcast({
        subject: "Subject",
        body: "Body",
        audienceType: "all",
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException)

    await flushBackgroundWork()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("dedupes and normalizes targeted recipients, returning the count synchronously", async () => {
    const result = await service.sendBroadcast({
      subject: "Hello",
      body: "Body",
      audienceType: "emails",
      emails: ["A@Example.com", " a@example.com ", "b@example.com"],
    })

    expect(result).toEqual({ recipientCount: 2 })

    await flushBackgroundWork()
  })

  it("sends to every resolved recipient in the background", async () => {
    getAllUserEmails.mockResolvedValue(["a@example.com", "b@example.com"])

    const result = await service.sendBroadcast({
      subject: "Subject",
      body: "Line 1\nLine 2",
      audienceType: "all",
    })

    expect(result).toEqual({ recipientCount: 2 })

    await flushBackgroundWork()

    expect(verifyTransport).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledTimes(2)
    expect(sendEmail).toHaveBeenCalledWith({
      to: "a@example.com",
      subject: "Subject",
      text: "Line 1\nLine 2",
      html: "<p>Line 1<br />Line 2</p>",
    })
  })

  it("escapes HTML in the body and keeps the plain-text version raw", async () => {
    const result = await service.sendBroadcast({
      subject: "Subject",
      body: "<b>hi</b> & 'you' <script>",
      audienceType: "emails",
      emails: ["a@example.com"],
    })

    expect(result.recipientCount).toBe(1)

    await flushBackgroundWork()

    const payload = sendEmail.mock.calls[0]?.[0]
    expect(payload.text).toBe("<b>hi</b> & 'you' <script>")
    expect(payload.html).toBe(
      "<p>&lt;b&gt;hi&lt;/b&gt; &amp; &#39;you&#39; &lt;script&gt;</p>",
    )
  })

  it("keeps delivering after a single recipient fails", async () => {
    sendEmail
      .mockRejectedValueOnce(new Error("smtp down"))
      .mockResolvedValue(undefined)

    const result = await service.sendBroadcast({
      subject: "Subject",
      body: "Body",
      audienceType: "emails",
      emails: ["a@example.com", "b@example.com"],
    })

    expect(result.recipientCount).toBe(2)

    await flushBackgroundWork()

    expect(sendEmail).toHaveBeenCalledTimes(2)
  })

  it("rejects a second broadcast while one is already in flight", async () => {
    let releaseSend: () => void = () => undefined
    sendEmail.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseSend = resolve
        }),
    )

    const first = await service.sendBroadcast({
      subject: "Subject",
      body: "Body",
      audienceType: "emails",
      emails: ["a@example.com"],
    })
    expect(first.recipientCount).toBe(1)

    await flushBackgroundWork()

    await expect(
      service.sendBroadcast({
        subject: "Subject",
        body: "Body",
        audienceType: "emails",
        emails: ["b@example.com"],
      }),
    ).rejects.toBeInstanceOf(ConflictException)

    expect(sendEmail).toHaveBeenCalledTimes(1)

    releaseSend()
    await flushBackgroundWork()

    const third = await service.sendBroadcast({
      subject: "Subject",
      body: "Body",
      audienceType: "emails",
      emails: ["c@example.com"],
    })
    expect(third.recipientCount).toBe(1)

    await flushBackgroundWork()
  })
})
