import { DataSourceDocType } from "../docTypes";
export declare type GoogleDriveDataSourceData = {
    applyTags: string[];
    folderId: string;
    folderName?: string;
};
export declare type DropboxDataSourceData = {
    folderId: string;
    folderName: string;
    applyTags: string[];
};
export declare const generateResourceId: (uniqueResourceIdentifier: string, resourceId: string) => string;
export declare const extractIdFromResourceId: (uniqueResourceIdentifier: string, resourceId: string) => string;
export declare const extractSyncSourceData: <Data extends Record<any, any>>({ data }: DataSourceDocType) => Data | undefined;
export declare const dataSourceHelpers: {
    generateResourceId: (uniqueResourceIdentifier: string, resourceId: string) => string;
    extractIdFromResourceId: (uniqueResourceIdentifier: string, resourceId: string) => string;
    extractSyncSourceData: <Data extends Record<any, any>>({ data }: DataSourceDocType) => Data | undefined;
};
