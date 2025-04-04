import type nano from "nano"

interface iUser extends nano.MaybeDocument {
  email: string
  password: string
  roles: string[]
  type: "user"
  name: string
}

export interface UserCouchEntity {
  password_scheme: string,
  pbkdf2_prf: string,
  salt: string,
  iterations: number,
  derived_key: string,
  email: string
  roles: string[]
  type: "user"
  name: string
}

export class User implements iUser {
  _rev: string | undefined
  roles: string[] = []
  type = "user" as const
  public name

  constructor(
    public _id: string,
    public email: string,
    public password: string,
  ) {
    this.name = email
  }

  processAPIResponse(response: nano.DocumentInsertResponse) {
    if (response.ok === true) {
      this._id = response.id
      this._rev = response.rev
    }
  }
}
