import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { Test } from "@nestjs/testing"
import { AppConfigService } from "./AppConfigService.js"
import { SecretsService } from "./SecretsService.js"

type KeyFiles = {
  keysDirectory: string
  privateKeyFile: string
  publicKeyFile: string
}

async function createKeyFiles(): Promise<KeyFiles> {
  const keysDirectory = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "oboku-jwt-keys-"),
  )

  onTestFinished(function removeKeysDirectory() {
    return fs.promises.rm(keysDirectory, { recursive: true, force: true })
  })

  return {
    keysDirectory,
    privateKeyFile: path.join(keysDirectory, "jwt_private_key.pem"),
    publicKeyFile: path.join(keysDirectory, "jwt_public_key.pem"),
  }
}

function createModule({ privateKeyFile, publicKeyFile }: KeyFiles) {
  return Test.createTestingModule({
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
}

describe("SecretsService", () => {
  it("keeps the keys it reads at startup", async () => {
    const keyFiles = await createKeyFiles()
    await fs.promises.writeFile(keyFiles.privateKeyFile, "private-key")
    await fs.promises.writeFile(keyFiles.publicKeyFile, "public-key")
    const module = await createModule(keyFiles)

    await module.init()
    await fs.promises.rm(keyFiles.keysDirectory, { recursive: true })

    const secrets = module.get(SecretsService)
    await expect(secrets.getJwtPrivateKey()).resolves.toBe("private-key")
    await expect(secrets.getJwtPublicKey()).resolves.toBe("public-key")
  })

  it("stops the startup when a key file is missing", async () => {
    const keyFiles = await createKeyFiles()
    await fs.promises.writeFile(keyFiles.publicKeyFile, "public-key")
    const module = await createModule(keyFiles)

    await expect(module.init()).rejects.toThrow(
      "Failed to read JWT private key file",
    )
  })
})
