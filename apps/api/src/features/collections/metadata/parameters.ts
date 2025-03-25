import { map } from "rxjs/operators"

import { from } from "rxjs"

import { defer } from "rxjs"
import { getParametersValue } from "src/lib/ssm"

export const parameters$ = defer(() =>
  from(
    getParametersValue({
      Names: ["jwt-private-key", "COMiCVINE_API_KEY"],
      WithDecryption: true,
    }),
  ).pipe(
    map(([jwtPrivateKey = ``, comicVineApiKey = ``]) => ({
      jwtPrivateKey,
      comicVineApiKey,
    })),
  ),
)
