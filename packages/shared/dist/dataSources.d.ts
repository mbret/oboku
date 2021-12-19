export declare enum DataSourceType {
    URI = "URI",
    DRIVE = "DRIVE",
    DROPBOX = "DROPBOX",
    FILE = "FILE",
    NHENTAI = "NHENTAI"
}
export declare const dataSourcePlugins: {
    DRIVE: {
        uniqueResourceIdentifier: string;
        type: DataSourceType;
    };
    DROPBOX: {
        uniqueResourceIdentifier: string;
        type: DataSourceType;
    };
    FILE: {
        uniqueResourceIdentifier: string;
        type: DataSourceType;
    };
    URI: {
        uniqueResourceIdentifier: string;
        type: DataSourceType;
    };
    NHENTAI: {
        uniqueResourceIdentifier: string;
        name: string;
        synchronizable: boolean;
        type: DataSourceType;
    };
};
export declare const generateResourceId: (uniqueResourceIdentifier: string, resourceId: string) => string;
export declare const extractIdFromResourceId: (uniqueResourceIdentifier: string, resourceId: string) => string;
export declare const dataSourceHelpers: {
    generateResourceId: (uniqueResourceIdentifier: string, resourceId: string) => string;
    extractIdFromResourceId: (uniqueResourceIdentifier: string, resourceId: string) => string;
};
