import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { Test } from "@nestjs/testing"
import { AppConfigService } from "./AppConfigService.js"
import { SecretsService } from "./SecretsService.js"

describe("SecretsService", () => {
  let keysDirectory: string
  let privateKeyFile: string
  let publicKeyFile: string

  const createModule = () =>
    Test.createTestingModule({
      providers: [
        SecretsService,
        {
          provide: AppConfigService,
          useValue: {
            JWT_PRIVATE_KEY_FILE: privateKeyFile,
            JWT_PUBLIC_KEY_FILE: publicKeyFile,
          },
        },
      ],
    }).compile()

  beforeEach(async () => {
    keysDirectory = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "oboku-jwt-keys-"),
    )
    privateKeyFile = path.join(keysDirectory, "jwt_private_key.pem")
    publicKeyFile = path.join(keysDirectory, "jwt_public_key.pem")
  })

  afterEach(async () => {
    await fs.promises.rm(keysDirectory, { recursive: true, force: true })
  })

  it("keeps the keys it reads at startup", async () => {
    await fs.promises.writeFile(privateKeyFile, "private-key")
    await fs.promises.writeFile(publicKeyFile, "public-key")
    const module = await createModule()

    await module.init()
    await fs.promises.rm(keysDirectory, { recursive: true, force: true })

    const secrets = module.get(SecretsService)
    await expect(secrets.getJwtPrivateKey()).resolves.toBe("private-key")
    await expect(secrets.getJwtPublicKey()).resolves.toBe("public-key")
  })

  it("stops the startup when a key file is missing", async () => {
    await fs.promises.writeFile(publicKeyFile, "public-key")
    const module = await createModule()

    await expect(module.init()).rejects.toThrow(
      "Failed to read JWT private key file",
    )
  })
})
