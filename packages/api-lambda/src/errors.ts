import { Errors } from '@oboku/shared/src'

export class ServerError extends Error {
  constructor(public previousError?: any) {
    super(previousError?.message)
    this.stack = previousError?.stack
  }
}

export class BadRequestError extends Error {
  constructor(public errors: { code: typeof Errors[keyof typeof Errors] }[] = []) {
    super('BadRequestError')
  }
}

export class NotFoundError extends Error {
  constructor(public errors: { code: typeof Errors[keyof typeof Errors] }[] = []) {
    super('NotFoundError')
  }
}

export class UnauthorizedError extends Error {
  constructor(public errors: { code: typeof Errors[keyof typeof Errors] }[] = []) {
    super('UnauthorizedError')
  }
}