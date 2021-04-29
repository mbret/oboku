export const Report = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    log: (...data) => {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log(`[oboku-reader]`, ...data);
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warn: (...data) => {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn(`[oboku-reader]`, ...data);
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: (...data) => {
        // eslint-disable-next-line no-console
        console.error(...data);
    },
    time: (label) => {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.time(`[oboku-reader] [metric] ${label}`);
        }
    },
    timeEnd: (label) => {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.timeEnd(`[oboku-reader] [metric] ${label}`);
        }
    },
    metric: (performanceEntry, targetDuration = Infinity) => {
        const duration = typeof performanceEntry === 'number' ? performanceEntry : performanceEntry.duration;
        if (process.env.NODE_ENV === 'development') {
            if (performanceEntry.duration <= targetDuration) {
                // eslint-disable-next-line no-console
                console.log(`[oboku-reader] [metric] `, `${performanceEntry.name} took ${duration}ms`);
            }
            else {
                // eslint-disable-next-line no-console
                console.warn(`[oboku-reader] [metric] `, `${performanceEntry.name} took ${performanceEntry.duration}ms which is above the ${targetDuration}ms target for this function`);
            }
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    measurePerformance: (name, targetDuration = 10, functionToMeasure) => {
        return (...args) => {
            const t0 = performance.now();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = functionToMeasure(...args);
            if (response && response.then) {
                return response.then((res) => {
                    const t1 = performance.now();
                    Report.metric({ name, duration: t1 - t0 }, targetDuration);
                    return res;
                });
            }
            const t1 = performance.now();
            Report.metric({ name, duration: t1 - t0 }, targetDuration);
            return response;
        };
    },
};
//# sourceMappingURL=report.js.map