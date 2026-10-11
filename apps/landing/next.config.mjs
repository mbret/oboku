/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      // The sources, as apps/web reads them through the "source" export
      // condition, which Turbopack has no option for. With the package's
      // `"sideEffects": false`, the bundle then leaves out the modules the
      // landing does not use; the single dist file would bring zod along.
      "@oboku/shared": "../../packages/shared/src/index.ts",
    },
  },
}

export default nextConfig
