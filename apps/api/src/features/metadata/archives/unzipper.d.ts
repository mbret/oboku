import "unzipper"

/**
 * unzipper 0.12 takes these options (`lib/Open/index.js`), which
 * `@types/unzipper` 0.10 does not declare.
 */
declare module "unzipper" {
  namespace Open {
    function file(
      filename: string,
      options?: { tailSize?: number },
    ): Promise<CentralDirectory>
  }
}
