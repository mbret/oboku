/**
 * @see https://github.com/rafamel/rxdb-utils/blob/master/src/replication.js
 * @see https://github.com/rafamel/rxdb-utils
 */
import { RxCollection, RxDatabase, RxDatabaseCreator, RxJsonSchema, RxReplicationState, SyncOptions } from 'rxdb';
import { BehaviorSubject, Subject } from 'rxjs';
import { overwritable } from 'rxdb/plugins/key-compression';

type ReplicationSyncOptions = Omit<SyncOptions, 'remote'> & {
  remote: PouchDB.Database<{}> | string
}

type SyncFn<Collections> = (options: {
  collectionNames?: (keyof Collections)[]
  syncOptions: (collectionName: string) => ReplicationSyncOptions
}) => Replication

declare module 'rxdb' {
  function createRxDatabase<Collections = {
    [key: string]: RxCollection;
  }>(options: RxDatabaseCreator): Promise<RxDatabase<Collections> & {
    sync: SyncFn<Collections>
  }>;
}

export const withReplicationSchema = <T>(name: string, schema: RxJsonSchema<T>): RxJsonSchema<T> => ({
  ...schema,
  properties: {
    ...schema.properties,
    rx_model: {
      type: 'string',
      enum: [name],
      default: name,
      final: true,
      rx_model: true
    }
  }
})

export const RxdbReplicationPlugin = {
  rxdb: true,
  overwritable: {
    createKeyCompressor(schema, ...args: any) {
      // @ts-ignore
      const ans = overwritable.createKeyCompressor(schema, ...args);

      let found = false;
      const entries: any = Object.entries(schema.normalized.properties);
      for (const [field, value] of entries) {
        if (value && value.rx_model) {
          found = true;
          // @ts-ignore
          ans._table = { ...ans.table, [field]: field };
          break;
        }
      }

      if (!found) {
        throw Error(
          `No field replication field was found on schema normalized properties`
        );
      }

      return ans;
    }
  },
  hooks: {
    createRxDatabase(database) {
      const options = database.options.replication;
      database.options.replication = {
        field: 'rx_model',
        ...options
      };
      database.replications = [];

      const sync: SyncFn<any> = function sync(...args) {
        // @ts-ignore
        const replication = new Replication(database, ...args);

        database.replications.push(replication);
        const index = database.replications.length - 1;
        // @ts-ignore
        replication.destroy = async function destroy() {
          await replication.cancel();
          database.replications = database.replications
            .slice(0, index)
            .concat(database.replications.slice(index + 1));
        };

        return replication;
      }

      database.sync = sync
    },
  }
};

class Replication {
  public collections: RxCollection[]
  replicationStates: any
  alive: boolean = false
  _field: any
  _states: any
  _subscribers: any
  _aliveSubject: any
  protected completed = false
  protected _activeSubject = new BehaviorSubject(false);
  protected _completeSubject = new Subject<boolean>();
  protected _errorSubject = new Subject<Error>()
  _pReplicationStates: Promise<RxReplicationState[]>
  private filterCreationInterval: number | undefined
  syncOptions: (collectionName: string) => ReplicationSyncOptions

  constructor(
    public database: any,
    { syncOptions, collectionNames }: Parameters<SyncFn<any>>[0]
  ) {
    this.syncOptions = syncOptions
    this.collections = !collectionNames
      ? database.collections
      : collectionNames.reduce((acc, key) => {
        if (database.collections[key]) acc[key] = database.collections[key];
        return acc;
      }, {});

    this.replicationStates = [];
    this._field = database.options.replication.field;
    this._states = [];
    this._subscribers = [];
    this._aliveSubject = new BehaviorSubject(false);
    this._pReplicationStates = Promise.resolve([]);

    this._errorSubject.asObservable().subscribe(e => {
      this._completeSubject.next(true)
      this._completeSubject.complete()
    })

    this.connect()
  }

  get alive$() {
    return this._aliveSubject.asObservable();
  }

  get active$() {
    return this._activeSubject.asObservable();
  }

  get error$() {
    return this._errorSubject.asObservable();
  }

  get complete$() {
    return this._completeSubject.asObservable();
  }

  private async connect() {

    await this.cancel();

    const tryToCreateFilter = async () => {
      try {
        await this.createFilter();
      } catch (e) {
        this._errorSubject.next(e);
        this.filterCreationInterval = setTimeout(() => {
          tryToCreateFilter()
        }, 5000) as unknown as number
      }
    }

    try {
      await tryToCreateFilter()
      await this._sync();
    } catch (e) {
      console.warn('error during replication', e)
      this._errorSubject.next(e);
    }
  }

  public async cancel() {
    clearTimeout(this.filterCreationInterval);

    this._subscribers.forEach((x) => x.unsubscribe());
    this._subscribers = [];
    this._states = [];

    if (this.alive) {
      this.alive = false;
      this._aliveSubject.next(false);
    }

    await this._pReplicationStates.then((replicationStates) => {
      return Promise.all(replicationStates.map((x) => x.cancel()));
    });
    this._pReplicationStates = Promise.resolve([]);
    this.replicationStates = [];
  }

  protected async _sync() {
    const collections = this.collections;
    const collectionNames = Object.keys(collections);

    const promises = collectionNames.map((name) => {
      const options = this.syncOptions(name)
      const collection = collections[name] as RxCollection
      return collection.sync({
        remote: options.remote,
        direction: options.direction,
        options: {
          ...options.options,
          filter: 'app/by_model' as any,
          query_params: { [this._field]: name }
        }
      });
    });


    const allAlive = promises.map(() => false);
    const allActive = promises.map(() => false);
    const allComplete = promises.map(() => false);

    const attachEventsToSubscription = (state: RxReplicationState, i: number) => {
      this._subscribers.push(state?.active$.subscribe(val => {
        console.warn(`sync ${state.collection.name} active(${val})`)
        const repActive = allActive[i];

        if (repActive === val) return;

        allActive[i] = val;

        const active = allActive.reduce((acc, x) => acc || x, true);

        if (active === this._activeSubject.value) return;
        this._activeSubject.next(active);
      }))

      this._subscribers.push(state.alive$.subscribe((val) => {
        console.warn(`sync ${state.collection.name} alive(${val})`)
        const repAlive = allAlive[i];

        if (repAlive === val) return;

        allAlive[i] = val;
        const alive = allAlive.reduce((acc, x) => acc && x, true);

        if (alive === this.alive) return;
        this.alive = alive;
        this._aliveSubject.next(alive);
      }))

      this._subscribers.push(state?.change$.subscribe(data => console.warn(`sync ${state.collection.name} change`, data)))

      this._subscribers.push(state?.denied$.subscribe(data => console.warn(`sync ${state.collection.name} denied`, data)))

      this._subscribers.push(state?.error$.subscribe((error) => {
        console.warn(`sync ${state.collection.name} error`, error)
        this._errorSubject.next(error)
      }))

      this._subscribers.push(state?.complete$.subscribe(val => {
        console.warn(`sync complete ${state.collection.name} `, val)
        const repComplete = allComplete[i];

        if (repComplete === val) return;

        allComplete[i] = val;

        const complete = allComplete.reduce((acc, x) => acc || x, true);

        if (complete) {
          this._completeSubject.next(complete)
          this._completeSubject.complete()
        }
      }))

      this._subscribers.push(state?.docs$.subscribe(data => console.warn(`sync ${state.collection.name} docs`, data)))
    }

    this._pReplicationStates = Promise.all(promises)
      .then((replicationStates) => {
        replicationStates.forEach(attachEventsToSubscription);

        return replicationStates;
      })
      .then((arr) => (this.replicationStates = arr));

    await this._pReplicationStates;
  }

  protected async createFilter() {
    const remote = this.syncOptions('filter').remote
    // https://pouchdb.com/2015/04/05/filtered-replication.html
    const field = this._field;
    const db = typeof remote === 'string' ? new PouchDB(remote) : remote;
    const doc = {
      version: 0,
      _id: '_design/app',
      filters: {
        // not doing fn.toString() as istambul code
        // on tests breaks it
        by_model: `function(doc, req) {
          return (
            doc._id === '_design/app' || doc["${field}"] === req.query["${field}"]
          );
        }`
      }
    };

    try {
      const meta = await db.get<typeof doc>('_design/app')
      if (meta.version < doc.version) {
        await db.put({ ...doc, _rev: meta?._rev })
      }
    } catch (e) {
      await db.put(doc)
    }

    db.close()
  }
}