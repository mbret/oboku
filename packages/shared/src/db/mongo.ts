/**
 * @see https://www.mongodb.com/docs/manual/reference/operator/query/or/
 */

export type MongoQueryLogicalIn<T> = Array<Exclude<T, undefined> | null>
