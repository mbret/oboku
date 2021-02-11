export declare type PromiseReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer U> ? U : any;
