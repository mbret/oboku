declare type ViewPort = {
    left: number;
    right: number;
    top: number;
    bottom: number;
};
export declare const getFirstVisibleNodeForViewport: (documentOrElement: Document | Element, viewport: ViewPort) => {
    node: Node;
    offset: number;
} | undefined;
export declare const getRangeFromNode: (node: Node, offset: number) => Range | undefined;
export {};
