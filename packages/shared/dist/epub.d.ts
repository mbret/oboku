export declare type OPF = {
    package?: {
        manifest?: {
            item?: [];
        };
        metadata?: {
            'dc:title'?: string | {
                '#text': string;
            };
            'title'?: any;
            'dc:date'?: any;
            'dc:creator'?: any;
            'dc:subject'?: any;
            'dc:language'?: any;
            'dc:publisher'?: {
                '#text': string;
                id: string;
            } | string;
            'dc:rights'?: any;
        };
    };
};
