import { useState, useMemo, useCallback } from "react";

export function usePagination<T>(items: T[], perPage: number) {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / perPage));
  }, [items.length, perPage]);

  const safePage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, safePage, perPage]);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page: safePage,
    totalPages,
    paginatedItems,
    resetPage,
    goToPage: setPage,
  };
}
