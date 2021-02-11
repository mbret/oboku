export declare const configure: (logger: {
    log: typeof console['log'];
    error: typeof console['error'];
}) => void;
export declare const Logger: {
    namespace: (name: string) => {
        log: (message?: any, ...optionalParams: any[]) => void;
        error: (...optionalParams: any[]) => void;
    };
    log: (message?: any, ...optionalParams: any[]) => void;
    error: (e: any) => void;
};
