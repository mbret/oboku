declare class CFI {
    isRange: boolean;
    parts: {}[];
    opts: {};
    cfi: string;
    constructor(str: string, opts: {});
    removeIllegalOpts(parts: any[]): void;
    static generatePart(node: Element | Node, offset?: number, extra?: {}): string;
    static generate(node: Node, offset?: number, extra?: {}): string;
    static toParsed(cfi: any): any;
    static comparePath(a: any[], b: any[]): number;
    static sort(a: any): void;
    static compare(a: any, b: any): number;
    static compareParts(a: any, b: any): number;
    decodeEntities(dom: Document, str: string): string;
    trueLength(dom: Document, str: string): number;
    getFrom(): any;
    getTo(): any;
    get(): any;
    parseSideBias(o: any, loc: any): void;
    parseSpatialRange(range: any): {
        x: number;
        y: number;
    } | undefined;
    parse(cfi: any): {
        parsed: {};
        offset: number;
        newDoc: boolean;
    };
    getChildNodeByCFIIndex(dom: Document, parentNode: Element, index: number, offset: number): {
        relativeToNode: string;
        offset: number;
    } | {
        node: ChildNode | undefined;
        relativeToNode: string;
        offset: number;
    } | {
        node: ChildNode | undefined;
        offset: number;
        relativeToNode?: undefined;
    } | undefined;
    isTextNode(node: Element): boolean;
    correctOffset(dom: Document, node: Element, offset: number, assertion: any): {
        node: Element;
        offset: any;
    };
    resolveNode(index: number, subparts: {
        nodeIndex: number;
        nodeID?: string;
        offset?: number;
    }[], dom: Document, opts: {}): {
        node: Document;
        offset: number;
    };
    resolveURI(index: number, dom: Document, opts: {
        ignoreIDs?: boolean;
    }): any;
    deepClone(o: any): any;
    resolveLocation(dom: Document, parts: {}[]): any;
    resolveLast(dom: Document, opts: {}): string | {};
    resolve(doc: Document, opts: {}): {
        node: Node;
    } | {
        node?: undefined;
    };
}
export { CFI };
export declare const extractObokuMetadataFromCfi: (cfi: string) => {
    cleanedCfi: string;
    itemId?: string | undefined;
    offset: number;
};
