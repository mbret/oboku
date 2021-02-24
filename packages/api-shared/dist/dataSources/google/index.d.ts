import { DataSource } from '../types';
import { configure } from './configure';
export { configure };
export declare const generateResourceId: (driveId: string) => string;
export declare const extractIdFromResourceId: (resourceId: string) => string;
export declare const wait: (ms: number) => Promise<unknown>;
export declare const dataSource: DataSource;
