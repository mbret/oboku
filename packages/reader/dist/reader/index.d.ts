import { createReader } from './reader';
export { Reader } from './reader';
export { createReader };
export { Manifest } from './types';
export declare type Pagination = ReturnType<ReturnType<typeof createReader>['getPagination']>;
