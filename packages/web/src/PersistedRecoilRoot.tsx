import { useRecoilTransactionObserver_UNSTABLE, RecoilRoot, useRecoilCallback, RecoilState, MutableSnapshot } from "recoil";
import localforage from 'localforage'
import React, { createContext, FC, memo, useContext, useEffect, useRef, useState } from "react";
import { Subject, asyncScheduler } from "rxjs";
import { throttleTime } from 'rxjs/operators'
import { Report } from "./report";
import { useCallback } from "react";
import { useMountedState } from "react-use";

const PersistedStatesContext = createContext<RecoilState<any>[]>([])

const usePersistance = () => {
  const statesToPersist = useContext(PersistedStatesContext)
  const subject = useRef(new Subject<{ [key: string]: any }>())

  useRecoilTransactionObserver_UNSTABLE(({ snapshot }) => {
    try {
      let changes = {}

      for (const modifiedAtom of snapshot.getNodes_UNSTABLE()) {
        // only persist the wanted state
        if (!statesToPersist.find(state => state.key === modifiedAtom.key)) continue

        const atomLoadable = snapshot.getLoadable(modifiedAtom);

        if (atomLoadable.state === 'hasValue') {
          changes[modifiedAtom.key] = { value: atomLoadable.contents }
        }
      }

      subject.current.next(changes)
    } catch (e) {
      Report.error(e)
    }
  });

  useEffect(() => {
    const listener$ = subject.current
      .pipe(throttleTime(500, asyncScheduler, { leading: false, trailing: true }))
      .subscribe(async (changes) => {
        try {
          const prevValue = await localforage.getItem<string>(`local-user`)
          await localforage.setItem(
            `local-user`,
            JSON.stringify({
              ...prevValue ? JSON.parse(prevValue) : {},
              ...changes
            })
          )
        } catch (e) {
          Report.error(e)
        }
      })

    return () => listener$.unsubscribe()
  }, [])
}

export const useResetStore = () => {
  const statesToReset = useContext(PersistedStatesContext)

  return useRecoilCallback(({ reset }) => async () => {
    statesToReset.forEach(key => {
      reset(key)
    })

    // force delete right away
    await localforage.setItem(`local-user`, JSON.stringify({}))
  })
}

const RecoilPersistor = () => {
  usePersistance()

  return null
}

export const PersistedRecoilRoot: FC<{
  states?: RecoilState<any>[],
  migration?: (state: { [key: string]: { value: any } }) => { [key: string]: { value: any } },
  onReady: () => void
}> = memo(({ children, states = [], onReady, migration = (state) => state }) => {
  const [initialeState, setInitialState] = useState<{ [key: string]: { value: any } } | undefined>(undefined)
  const alreadyLoaded = useRef(!!initialeState)
  const isMounted = useMountedState()
  // const alreadyInitialized = useRef(false)
  // const alreadyInitializedV = alreadyInitialized.current

  useEffect(() => {
    (async () => {
      if (!alreadyLoaded.current) {
        const restored = await localforage.getItem<string>(`local-user`)
        alreadyLoaded.current = true
        const loadedState = restored ? JSON.parse(restored) as { [key: string]: { value: any } } : {}
        if (isMounted()) {
          setInitialState(migration(loadedState))
          onReady()
        }
      }
    })()
  }, [onReady, migration, isMounted])

  const initializeState = useCallback(({ set }: MutableSnapshot) => {
    console.log('PersistedRecoilRoot initializeState cb', initialeState)
    if (initialeState) {
      Object.keys(initialeState || {}).forEach((key) => {
        const stateToRestore = states.find(state => state.key === key)
        if (stateToRestore) {
          set(stateToRestore, initialeState[key].value);
        }
      })
    };
    // alreadyInitialized.current = true;
  }, [initialeState, states])

  console.log('PersistedRecoilRoot', initialeState)

  return (
    <PersistedStatesContext.Provider value={states}>
      {!!initialeState ? (
        <RecoilRoot initializeState={initializeState} >
          <RecoilPersistor />
          {children}
        </RecoilRoot>
      ) : null}
    </PersistedStatesContext.Provider>
  )
})