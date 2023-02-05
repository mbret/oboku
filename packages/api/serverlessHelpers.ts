import type { AWS } from "@serverless/typescript"

export const getCommon = (): Pick<
  AWS,
  `service` | `frameworkVersion` | `useDotenv`
> => ({
  service: "oboku-api",
  frameworkVersion: "3",
  useDotenv: true
})

export const handlerPath = (context: string) => {
  return `${context.split(process.cwd())[1].substring(1).replace(/\\/g, "/")}`
}
