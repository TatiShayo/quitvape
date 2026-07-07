/** Shared AsyncStorage-backed persist storage for zustand stores. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

export const asyncStorage = createJSONStorage(() => AsyncStorage);
