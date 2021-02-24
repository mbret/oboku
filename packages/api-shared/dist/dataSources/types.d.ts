/// <reference types="node" />
import { Request } from 'request';
import { DataSourceType, LinkDocType } from '@oboku/shared/src';
import { createHelpers } from './helpers';
declare type NameWithMetadata = string;
declare type ISOString = string;
declare type SynchronizableItem = {
    type: 'file' | 'folder';
    resourceId: string;
    name: NameWithMetadata;
    items?: SynchronizableItem[];
    modifiedAt: ISOString;
};
export declare type SynchronizableDataSource = {
    name: string;
    items: SynchronizableItem[];
};
export declare type DataSource = {
    download: (link: LinkDocType, credentials?: any) => Promise<{
        stream: NodeJS.ReadableStream | Request;
        metadata: {
            size?: string;
            contentType?: string;
            name: string;
        };
    }>;
    sync: (options: {
        userEmail: string;
        dataSourceId: string;
        credentials?: any;
        dataSourceType: DataSourceType;
    }, helper: ReturnType<typeof createHelpers>) => Promise<SynchronizableDataSource>;
};
export {};
