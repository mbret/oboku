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
    };
    DROPBOX: {
        uniqueResourceIdentifier: string;
    };
    FILE: {
        uniqueResourceIdentifier: string;
    };
    URI: {
        uniqueResourceIdentifier: string;
    };
    NHENTAI: {
        uniqueResourceIdentifier: string;
        name: string;
        synchronizable: boolean;
        type: DataSourceType;
    };
};
