import { Subject } from "rxjs";
import { Action } from "./types";

export const actionSubject$ = new Subject<Action>()
