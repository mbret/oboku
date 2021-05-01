import { Archive } from "../types";
declare type KoboInformation = {
    renditionLayout?: `reflowable` | `pre-paginated` | undefined;
};
export declare const extractKoboInformationFromArchive: (archive: Archive) => Promise<KoboInformation>;
export {};
