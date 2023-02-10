type Code = "unknown" | "cancelled"

export class ObokuPluginError extends Error {
  code: Code
  obokuError = true

  constructor({ code }: { code: Code }) {
    super("Plugin error")

    this.code = code

    // 👇️ because we are extending a built-in class
    Object.setPrototypeOf(this, ObokuPluginError.prototype)
  }
}

export const isPluginError = (error: unknown): error is ObokuPluginError =>
  error instanceof ObokuPluginError ||
  (!!error && typeof error === "object" && "obokuError" in error)

export const createError = () => {}
