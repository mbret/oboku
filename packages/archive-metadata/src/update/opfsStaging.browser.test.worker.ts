import { openOpfsStagingScope } from "./opfsStaging"

const scope = await openOpfsStagingScope()

await scope.stageBytes(new Uint8Array([1]).buffer)

postMessage("staged")
