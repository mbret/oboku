import { BadRequestException, ValidationPipe } from "@nestjs/common"
import { UpdateInstanceSettingsDto } from "./admin.dto.js"

const validateSettings = (body: unknown) =>
  new ValidationPipe().transform(body, {
    type: "body",
    metatype: UpdateInstanceSettingsDto,
  })

describe("UpdateInstanceSettingsDto", () => {
  it("accepts a percentage rule for the per-user download quota", async () => {
    const body = {
      proxiedDownloadUserQuota: { type: "percentage", percent: 5 },
    }

    await expect(validateSettings(body)).resolves.toEqual(body)
  })

  it.each([
    ["a percentage of 0", { type: "percentage", percent: 0 }],
    ["a percentage above 100", { type: "percentage", percent: 101 }],
    ["a rule type the API does not know", { type: "fixed", percent: 5 }],
  ])("refuses %s for the per-user download quota", async (_, rule) => {
    await expect(
      validateSettings({ proxiedDownloadUserQuota: rule }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
