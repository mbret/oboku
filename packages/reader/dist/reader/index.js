import { createPublicApi } from './publicApi';
import { createReader as createInternalReader } from './reader';
export const createReader = ({ containerElement }) => {
    const reader = createInternalReader({ containerElement });
    const publicApi = createPublicApi(reader);
    return publicApi;
};
//# sourceMappingURL=index.js.map