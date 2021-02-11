import { RxQueryOptions } from "rxdb";
import { MongoUpdateSyntax, OneValue } from "../types";

export type MangoQuerySelector<T> = RxQueryOptions<T>

export type SafeMangoQuery<RxDocType = any> = {
  selector: { [key in keyof RxDocType]?: RxDocType[key] | MangoQuerySelector<OneValue<RxDocType[key]>> };
};

export type SafeUpdateMongoUpdateSyntax<D> = MongoUpdateSyntax<Partial<D>>