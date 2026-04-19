import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/error-utils";

export type PaginatedFetcher<T> = (
  limit: number,
  offset: number,
) => Promise<{ count: number; results: T[] }>;

/**
 * Paginated list: refetches when `page` or `itemsPerPage` changes.
 * Pass a stable fetcher (e.g. imported `getUsers`); identity changes are handled via ref.
 */
export function usePaginatedQuery<T>(
  fetchPage: PaginatedFetcher<T>,
  errorFallback: string,
  itemsPerPage = 10,
) {
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const [page, setPage] = useState(1);
  const [data, setData] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * itemsPerPage;
      const res = await fetchRef.current(itemsPerPage, offset);
      setData(res.results);
      setTotalCount(res.count);
    } catch (e) {
      setError(getErrorMessage(e, errorFallback));
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    data,
    setData,
    totalCount,
    loading,
    error,
    setError,
    page,
    setPage,
    itemsPerPage,
    refetch,
  };
}
