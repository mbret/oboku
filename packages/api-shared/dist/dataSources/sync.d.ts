import { DataSource, SynchronizableDataSource } from "./types";
import { createHelpers } from "./helpers";
declare type Context = Parameters<DataSource['sync']>[0];
export declare const sync: (synchronizable: SynchronizableDataSource, ctx: Context, helpers: ReturnType<typeof createHelpers>) => Promise<void>;
export {};
