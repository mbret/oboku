export declare type PromiseReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer U> ? U : any;
/**
 * @link https://stackoverflow.com/a/49670389/3443137
 */
declare type DeepReadonly<T> = T extends (infer R)[] ? DeepReadonlyArray<R> : T extends Function ? T : T extends object ? DeepReadonlyObject<T> : T;
export interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {
}
export declare type DeepReadonlyObject<T> = {
    readonly [P in keyof T]: DeepReadonly<T[P]>;
};
export {};
