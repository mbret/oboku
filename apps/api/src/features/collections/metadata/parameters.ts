import { map } from "rxjs/operators"

import { from } from "rxjs"

import { defer } from "rxjs"
import { getParametersValue } from "src/lib/ssm"

export const parameters$ = defer(() =>
  from(
    getParametersValue({
      Names: ["jwt-private-key"],
      WithDecryption: true,
    }),
  ).pipe(
    map(([jwtPrivateKey = ``]) => ({
      jwtPrivateKey,
    })),
  ),
)
