import type { SecretDocType } from "@oboku/shared"
import type {
  MigrationStrategies,
  RxCollection,
  RxCollectionCreator,
  RxDocument,
  RxJsonSchema,
} from "rxdb"
import { getReplicationProperties } from "../replication/getReplicationProperties"
import { from, type Observable, switchMap } from "rxjs"
import { throwIfNotDefined } from "../../common/rxjs/operators"

// biome-ignore lint/complexity/noBannedTypes: <explanation>
type DocMethods = {}

export type RxdbSecretDocType = Omit<
  SecretDocType,
  `_rev` | `rxdbMeta` | `rxdbMeta`
>

type CollectionMethods = {
  incrementalRemoveDocument: (
    id: string,
  ) => Observable<RxDocument<RxdbSecretDocType>>
  incrementalPatchDocument: (
    id: string,
    patch: Partial<RxdbSecretDocType>,
  ) => Observable<RxDocument<RxdbSecretDocType>>
}

export type SecretCollection = RxCollection<
  RxdbSecretDocType,
  DocMethods,
  CollectionMethods
>

const schema: RxJsonSchema<RxdbSecretDocType> = {
  title: "secret",
  version: 0,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: `string`, maxLength: 100 },
    name: { type: ["string"], final: false },
    createdAt: { type: "string" },
    modifiedAt: { type: ["string", "null"] },
    value: {
      type: ["object"],
      properties: {
        iv: { type: "string" },
        data: { type: "string" },
      },
      required: ["iv", "data"],
    },
    ...getReplicationProperties(`secret`),
  },
  required: ["name", "value"],
}

const docMethods: DocMethods = {}

const statics: CollectionMethods = {
  incrementalRemoveDocument: function (this: SecretCollection, id: string) {
    const removed$ = from(this.findOne(id).exec()).pipe(
      throwIfNotDefined,
      switchMap((doc) => from(doc.incrementalRemove())),
    )

    return removed$
  },
  incrementalPatchDocument: function (this: SecretCollection, id: string, patch: Partial<RxdbSecretDocType>) {
    const patched$ = from(this.findOne(id).exec()).pipe(
      throwIfNotDefined,
      switchMap((doc) => from(doc.incrementalPatch(patch))),
    )

    return patched$
  },
}

const migrationStrategies: MigrationStrategies = {}

export const secretCollection: RxCollectionCreator<RxdbSecretDocType> = {
  schema: schema,
  methods: docMethods,
  statics,
  migrationStrategies: migrationStrategies,
}
