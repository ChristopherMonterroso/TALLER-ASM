import { useState, useMemo } from 'react';

/**
 * Hook de paginación reutilizable.
 * @param {Array} items - Lista completa de elementos ya filtrados.
 * @param {number} pageSize - Elementos por página.
 * @returns {{ page, totalPages, paginated, goTo, next, prev, reset }}
 */
export function usePagination(items, pageSize = 15) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Si el filtro reduce la lista, vuelve a la página 1 automáticamente
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  const goTo = (n) => setPage(Math.min(Math.max(1, n), totalPages));
  const next = () => goTo(safePage + 1);
  const prev = () => goTo(safePage - 1);
  const reset = () => setPage(1);

  return { page: safePage, totalPages, paginated, goTo, next, prev, reset };
}
