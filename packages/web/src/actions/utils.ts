import { filter, OperatorFunction } from "rxjs";
import { Action } from "./types";

export function ofType<
  Input extends Action,
  Type extends Input['type'],
  Output extends Input = Extract<Input, { type: Type }>
>(type: Type): OperatorFunction<Input, Output> {
  return filter((action): action is Output => action.type === type)
}
