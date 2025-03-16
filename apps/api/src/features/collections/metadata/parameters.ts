import { map } from "rxjs/operators"

import { from } from "rxjs"

import { defer } from "rxjs"
import { getParametersValue } from "src/lib/ssm"

export const parameters$ = defer(() =>
  from(
    getParametersValue({
      Names: [
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_API_KEY",
        "jwt-private-key",
        "COMiCVINE_API_KEY",
      ],
      WithDecryption: true,
    }),
  ).pipe(
    map(
      ([
        client_id = ``,
        client_secret = ``,
        googleApiKey = ``,
        jwtPrivateKey = ``,
        comicVineApiKey = ``,
      ]) => ({
        client_id,
        client_secret,
        googleApiKey,
        jwtPrivateKey,
        comicVineApiKey,
      }),
    ),
  ),
)
