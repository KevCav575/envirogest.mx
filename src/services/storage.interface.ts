/**
 * IStorageService — abstract interface for all data access.
 *
 * Current implementation: LocalStorageService (src/services/localStorage.service.ts)
 * Future implementation:  ApiService (src/services/api.service.ts) backed by MySQL via REST/tRPC.
 *
 * To switch to a real backend:
 *  1. Implement ApiService satisfying this interface.
 *  2. Replace the import in src/store/useAppStore.ts.
 */
import type { AppData, Proyecto, User } from '@/types';

export interface IStorageService {
  // Raw snapshot (used by Zustand initializer)
  getData(): AppData;
  saveData(data: AppData): void;

  // Users
  getUserByEmail(email: string): User | undefined;
  getUserById(id: string): User | undefined;

  // Projects
  getProjectByClientId(clientId: string): Proyecto | undefined;
}
