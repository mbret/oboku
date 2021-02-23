import { useRecoilTransactionObserver_UNSTABLE, RecoilRoot, useRecoilCallback, RecoilState, MutableSnapshot } from "recoil";
import localforage from 'localforage'
import React, { createContext, FC, useContext, useEffect, useRef, useState } from "react";
import { Subject, asyncScheduler } from "rxjs";
import { throttleTime } from 'rxjs/operators'
import { Report } from "./report";
import { useCallback } from "react";

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
  onReady: () => void
}> = ({ children, states = [], onReady }) => {
  const [initialeState, setInitialState] = useState<{ [key: string]: { value: any } } | undefined>(undefined)
  const alreadyLoaded = useRef(!!initialeState)
  // const alreadyInitialized = useRef(false)
  // const alreadyInitializedV = alreadyInitialized.current

  useEffect(() => {
    (async () => {
      if (!alreadyLoaded.current) {
        const restored = await localforage.getItem<string>(`local-user`)
        alreadyLoaded.current = true
        setInitialState(restored ? JSON.parse(restored) : {})
        onReady()
      }
    })()
  }, [onReady])

  const initializeState = useCallback(({ set }: MutableSnapshot) => {
    console.log('PersistedRecoilRoot initializeState cb')
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
}