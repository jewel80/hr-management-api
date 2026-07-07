/** Pagination metadata returned alongside every paginated collection. */
export interface PaginationMeta {
  /** Current page number (1-based) */
  page: number;
  /** Page size used for this request */
  limit: number;
  /** Total number of matching records across all pages */
  total: number;
  /** Total number of pages derived from total / limit */
  totalPages: number;
}

/** Standard wrapper for any paginated collection response. */
export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}
