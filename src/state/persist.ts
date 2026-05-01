/**
 * Zustand persist storage adapter backed by react-native-mmkv.
 *
 * MMKV is sync, ~30x faster than AsyncStorage, and keeps the persist
 * middleware contract tiny — Zustand just needs string get/set/remove.
 */

import { MMKV } from 'react-native-mmkv';
import { type StateStorage } from 'zustand/middleware';

const storage = new MMKV({ id: 'noor.zustand' });

export const mmkvStorage: StateStorage = {
  getItem: (name) => {
    const v = storage.getString(name);
    return v ?? null;
  },
  setItem: (name, value) => {
    storage.set(name, value);
  },
  removeItem: (name) => {
    storage.delete(name);
  },
};
