import { useMemo, useState } from 'react';
import { useDebounce } from './useDebounce.js';
import { PRIORITY_ORDER } from '../utils/constants.js';

const PAGE_SIZE = 8;

export function useTicketFilters(tickets) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: 'All', priority: 'All', status: 'All' });
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 250);

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return tickets
      .filter((ticket) => {
        const matchesQuery =
          !query ||
          ticket.title.toLowerCase().includes(query) ||
          String(ticket.id).includes(query) ||
          ticket.assignee.toLowerCase().includes(query);
        const matchesCategory = filters.category === 'All' || ticket.category === filters.category;
        const matchesPriority = filters.priority === 'All' || ticket.priority === filters.priority;
        const matchesStatus = filters.status === 'All' || ticket.status === filters.status;
        return matchesQuery && matchesCategory && matchesPriority && matchesStatus;
      })
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.id - a.id);
  }, [tickets, debouncedSearch, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  return {
    search,
    setSearch: updateSearch,
    filters,
    updateFilter,
    page: safePage,
    setPage,
    totalPages,
    pageSize: PAGE_SIZE,
    results: paginated,
    totalResults: filtered.length,
  };
}
