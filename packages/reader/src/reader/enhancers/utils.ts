import { Enhancer } from "../createReader";
import compose from "../utils/compose";

export type ComposeEnhancer<
A extends Enhancer<any> = Enhancer<{}>, 
B extends Enhancer<any> = Enhancer<{}>, 
C extends Enhancer<any> = Enhancer<{}>,
D extends Enhancer<any> = Enhancer<{}>,
E extends Enhancer<any> = Enhancer<{}>
> =
  Enhancer<
    & ReturnType<ReturnType<A>>
    & ReturnType<ReturnType<B>>
    & ReturnType<ReturnType<C>>
    & ReturnType<ReturnType<D>>
    & ReturnType<ReturnType<E>>
  >

export function composeEnhancer<A extends Enhancer<any>>(a: A): ComposeEnhancer<A>
export function composeEnhancer<A extends Enhancer<any>, B extends Enhancer<any>>(a: A, b: B): ComposeEnhancer<A, B>
export function composeEnhancer<A extends Enhancer<any>, B extends Enhancer<any>, C extends Enhancer<any>>(a: A, b: B, c: C): ComposeEnhancer<A, B, C>
export function composeEnhancer<A extends Enhancer<any>, B extends Enhancer<any>, C extends Enhancer<any>, D extends Enhancer<any>>(a: A, b: B, c: C, D: D): ComposeEnhancer<A, B, C, D>
export function composeEnhancer(...funcs: any[]) {
  return compose(...funcs)
}