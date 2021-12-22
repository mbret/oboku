export declare enum DataSourceType {
    URI = "URI",
    DRIVE = "DRIVE",
    DROPBOX = "DROPBOX",
    FILE = "FILE",
    NHENTAI = "NHENTAI"
}
export declare type DataSourcePlugin = {
    uniqueResourceIdentifier: string;
    name?: string;
    synchronizable?: boolean;
    type: DataSourceType;
    sensitive?: boolean;
};
export declare const dataSourcePlugins: {
    [key in DataSourceType]: DataSourcePlugin;
};
export declare const generateResourceId: (uniqueResourceIdentifier: string, resourceId: string) => string;
export declare const extractIdFromResourceId: (uniqueResourceIdentifier: string, resourceId: string) => string;
export declare const dataSourceHelpers: {
    generateResourceId: (uniqueResourceIdentifier: string, resourceId: string) => string;
    extractIdFromResourceId: (uniqueResourceIdentifier: string, resourceId: string) => string;
};
