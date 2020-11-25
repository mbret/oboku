export type PromiseReturnType<T extends (...args: any) =>
  Promise<any>> = T extends (...args: any) => Promise<infer U> ? U : any;

export type NonMaybe<T> = {
  [P in keyof T]-?: NonNullable<T[P]>
};