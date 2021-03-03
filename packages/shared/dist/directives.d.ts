/**
* Will extract any oboku normalized metadata that exist in the resource id string.
* Use this method to enrich the content that is being synchronized
* @example
* "foo [oboku~no_collection]" -> { isCollection: false }
* "foo [oboku~tags~bar]" -> { tags: ['bar'] }
* "foo [oboku~tags~bar,bar2]" -> { tags: ['bar', 'bar2'] }
*/
export declare const extractMetadataFromName: (resourceId: string) => {
    isNotACollection: boolean;
    tags: string[];
    isIgnored: boolean;
    direction: 'rtl' | 'ltr' | undefined;
    isbn?: string | undefined;
};
export declare const removeDirectiveFromString: (str: string) => string;
