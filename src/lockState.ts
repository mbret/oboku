import { atom, selector, useRecoilState } from "recoil";

type Key = 'authorize'

const lockState = atom<Key[]>({
  key: 'lock',
  default: [],
})

export const isLockedState = selector({
  key: 'isLockedState',
  get: ({ get }) => !!get(lockState).length
});

export const useLock = () => {
  const [, setLock] = useRecoilState(lockState)
  const lock = (key: Key) => {
    setLock(old => [...old, key])
  }

  const unlock = (key: Key) => {
    setLock(old => {
      const index = old.findIndex(k => k === key)

      return [...old.slice(0, index), ...old.slice(index + 1)];
    })
  }

  return [lock, unlock] as [typeof lock, typeof unlock]
}