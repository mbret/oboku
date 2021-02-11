/// <reference types="node" />
/// <reference types="request" />
import { LinkDocType } from "@oboku/shared";
import createNano from 'nano';
export declare const dataSourceFacade: {
    dowload: (link: LinkDocType, credentials?: any) => Promise<{
        stream: NodeJS.ReadableStream | import("request").Request;
        metadata: {
            size?: string | undefined;
            contentType?: string | undefined;
            name?: string | undefined;
        };
    }>;
    sync: ({ dataSourceId, userEmail, credentials, refreshBookMetadata, db, isBookCoverExist }: {
        dataSourceId: string;
        userEmail: string;
        credentials?: any;
        refreshBookMetadata: ({ bookId }: {
            bookId: string;
        }) => Promise<any>;
        isBookCoverExist: ({ coverId }: {
            coverId: string;
        }) => Promise<boolean>;
        db: createNano.DocumentScope<unknown>;
    }) => Promise<void>;
};
