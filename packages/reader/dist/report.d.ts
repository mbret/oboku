export declare const Report: {
    log: (...data: any[]) => void;
    warn: (...data: any[]) => void;
    error: (...data: any[]) => void;
    time: (label?: string | undefined) => void;
    timeEnd: (label?: string | undefined) => void;
    metric: (performanceEntry: PerformanceEntry | {
        name: string;
        duration: number;
    }, targetDuration?: number) => void;
    measurePerformance: <F extends (...args: any[]) => any>(name: string, targetDuration: number | undefined, functionToMeasure: F) => (...args: Parameters<F>) => ReturnType<F>;
};
