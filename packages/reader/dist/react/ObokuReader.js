import React, { useEffect, useState } from "react";
import { createReader } from "../reader/reader";
export const ObokuReader = ({ manifest, onReady, onReader, loadOptions, onPaginationChange }) => {
    const [reader, setReader] = useState(undefined);
    useEffect(() => {
    }, []);
    useEffect(() => {
        const readerSubscription$ = reader === null || reader === void 0 ? void 0 : reader.$.subscribe((data) => {
            if (data.event === 'ready') {
                onReady && onReady();
            }
            if (data.event === 'paginationChange') {
                onPaginationChange && onPaginationChange(reader.getPagination());
            }
        });
        return () => readerSubscription$ === null || readerSubscription$ === void 0 ? void 0 : readerSubscription$.unsubscribe();
    }, [reader, onReady]);
    useEffect(() => {
        if (manifest && reader) {
            reader.load(manifest, loadOptions, loadOptions === null || loadOptions === void 0 ? void 0 : loadOptions.spineIndexOrIdOrCfi);
        }
    }, [manifest, reader, loadOptions]);
    useEffect(() => {
        return () => reader === null || reader === void 0 ? void 0 : reader.destroy();
    }, [reader]);
    return (React.createElement("div", { id: "container", style: {
            width: `100%`,
            height: `100%`
        }, ref: ref => {
            if (ref && !reader) {
                const reader = createReader({ containerElement: ref });
                setReader(reader);
                onReader && onReader(reader);
            }
        } }));
};
//# sourceMappingURL=ObokuReader.js.map