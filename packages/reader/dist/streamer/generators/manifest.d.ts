import { Archive } from '../types';
import { Manifest } from '../../types';
export declare const generateManifestFromEpub: (archive: Archive, baseUrl: string) => Promise<Manifest>;
export declare const generateManifestFromArchive: (archive: Archive, baseUrl: string) => Promise<Manifest>;
export declare const generateManifestResponse: (archive: Archive, { baseUrl }: {
    baseUrl: string;
}) => Promise<Response>;
