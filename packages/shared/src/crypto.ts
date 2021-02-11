const sha256 = require("crypto-js/sha256")

/**
 * The contentPassword is for user content protection. It is made to work
 * offline and therefore is not secured yet. This is not intended for
 * fully secured solution
 */
export const hashContentPassword = (password: string) => {
  return sha256(password).toString();
}