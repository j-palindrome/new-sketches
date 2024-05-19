import { produce } from 'immer'
import _ from 'lodash'
import { useRef } from 'react'
import { createWithEqualityFn } from 'zustand/traditional'

export const useAppStore = createWithEqualityFn<AppState>(() => {
  const state: AppState = {}
  return state
})

const modify = (modifier: (state: AppState) => void) => {
  useAppStore.setState(produce(modifier))
}

export const setters = {
  set: (newState: Partial<AppState>) => {
    modify(() => newState)
  }
}

export const getters = {
  get: <T extends keyof AppState>(key: T) => useAppStore.getState()[key]
}

export const useAppStoreRef = <T>(callback: (state: AppState) => T) => {
  const storeValue: T = useAppStore(callback)
  const storeValueRef = useRef(storeValue)
  storeValueRef.current = storeValue
  return [storeValue, storeValueRef] as [typeof storeValue, typeof storeValueRef]
}
