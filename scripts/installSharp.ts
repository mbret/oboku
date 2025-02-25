import packageJson from "../packages/api/package.json"
import { spawn as spwn, execSync } from "node:child_process"
const arg = require("arg")

const args = arg(
  {
    "--platform": [String],
  },
  {
    permissive: true,
  },
)

console.log(args)

const spawn = (
  cmd: string,
  args?: Parameters<typeof spwn>[1],
  options?: Parameters<typeof spwn>[2],
) =>
  new Promise((resolve, reject) => {
    console.log(`run: ${cmd} ${args.join(" ")}`)
    const cp = spwn(cmd, args, {
      stdio: "inherit",
      ...options,
    })
    cp.on("close", (code) => {
      if (code !== 0) reject(new Error("Error"))
      else resolve("")
    })
  })

const dependencies = packageJson?.dependencies ?? {}

const sharpDep = Object.keys(dependencies).find((name, index) => {
  return name === "sharp"
})

const version = String(dependencies[sharpDep] ?? "")

if (!version) {
  console.warn("Did not found sharp dependency in api package")
  process.exit(1)
}

if (version.includes("^")) {
  console.error("Use a strict version for sharp! No caret `^`")
  process.exit(1)
}

console.log("Found sharp dependency in api package", version)
;(async () => {
  try {
    console.log("Removing current sharp module...")
    await spawn(`rm`, [`-rf`, `node_modules/sharp`])

    console.log("Install correct sharp module for platform")
    // problems of lib download with spawn, using exec as fallback
    execSync(
      `SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install --verbose --arch=x64 --platform=${args["--platform"]} sharp@${version}`,
    )
  } catch (e) {
    console.error(e)

    process.exit(1)
  }
})()
