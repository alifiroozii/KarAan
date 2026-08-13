import { ApiResponse } from "./index";

export type { ApiResponse };

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
