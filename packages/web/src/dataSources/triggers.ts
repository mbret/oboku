import { trigger } from "reactjrx"

export const [toggleDatasourceProtected$, toggleDatasourceProtected] =
  trigger<string>()
