import { env } from '@/config/env';
import { apiService } from './api/apiService';
import { hybridService } from './hybrid/hybridService';
import { mockService } from './mock/mockService';
import type { DataService } from './data/types';

/** The active data source. Screens import `data` and never know which one it is. */
const services = { mock: mockService, api: apiService, hybrid: hybridService } as const;
export const data: DataService = services[env.DATA_MODE];

export * from './data/types';
export { ApiError, toApiError } from './api/errors';
