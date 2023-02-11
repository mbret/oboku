import { RxQueryOptions } from "rxdb"
import { MongoUpdateSyntax, OneValue } from "../types"

export type MangoQuerySelector<T> = RxQueryOptions<T>

export type SafeMangoQuery<RxDocType = object> = {
  selector?: {
    [key in keyof RxDocType]?:
      | RxDocType[key]
      | MangoQuerySelector<OneValue<RxDocType[key]>>
  }
  // fields?: (keyof RxDocType)[]
}

export type SafeUpdateMongoUpdateSyntax<D> = MongoUpdateSyntax<Partial<D>>
