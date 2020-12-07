export type PromiseReturnType<T extends (...args: any) =>
  Promise<any>> = T extends (...args: any) => Promise<infer U> ? U : any;

export type NonMaybe<T> = {
  [P in keyof T]-?: NonNullable<T[P]>
};

export type OneValue<T> = T extends Array<any> ? T[number] : T

export type MongoUpdateSyntax<DocType> = {
  $set?: DocType,
  $push?: { [key in keyof DocType]?: OneValue<DocType[key]> },
  $pullAll?: { [key in keyof DocType]?: DocType[key] },
}