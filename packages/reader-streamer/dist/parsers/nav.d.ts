import xmldoc from 'xmldoc';
import { Archive } from '../types';
export declare const parseToc: (opfXmlDoc: xmldoc.XmlDocument, archive: Archive, opfBasePath: string) => Promise<any[] | undefined>;
