// @ts-nocheck
// Search, filters and paging for the group-life lists (Scheme Admin, Endorsements, Renewals).
// Everything goes to the server in one query: GET /grouplife/policies matches Search against the
// scheme number and the insured's name, across every page. Changing a filter returns to page 1 in
// the same update, so a stale page is never fetched; the slice drops out-of-order responses.
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "../../hooks/use-apps";
import { fetchGroupLifePolicies } from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";

export interface GroupLifeFilters {
  searchValue: string;
  startDate: string;
  endDate: string;
  status: string;
  subRiskId: string;
}

const EMPTY: GroupLifeFilters = { searchValue: "", startDate: "", endDate: "", status: "all", subRiskId: "all" };

export const useGroupLifeList = ({ pageSize = 20, onReset }: { pageSize?: number; onReset?: () => void } = {}) => {
  const dispatch = useAppDispatch();
  const [filterCriteria, setFilterCriteria] = useState<GroupLifeFilters>(EMPTY);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setPage] = useState(1);

  const reset = () => onReset?.();

  // wait for a pause in typing before searching
  useEffect(() => {
    const next = filterCriteria.searchValue.trim();
    if (next === debouncedSearch) return;
    const t = setTimeout(() => {
      setDebouncedSearch(next);
      setPage(1);
      reset();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCriteria.searchValue]);

  const listQuery = useMemo(
    () => ({
      page: currentPage,
      pageSize,
      search: debouncedSearch || undefined,
      status: filterCriteria.status !== "all" ? filterCriteria.status.toUpperCase() : undefined,
      fromDate: filterCriteria.startDate || undefined,
      toDate: filterCriteria.endDate || undefined,
      subRiskId: filterCriteria.subRiskId !== "all" ? filterCriteria.subRiskId : undefined,
    }),
    [currentPage, pageSize, debouncedSearch, filterCriteria.status, filterCriteria.startDate, filterCriteria.endDate, filterCriteria.subRiskId]
  );

  useEffect(() => {
    dispatch(fetchGroupLifePolicies(listQuery));
  }, [dispatch, listQuery]);

  const refreshList = () => dispatch(fetchGroupLifePolicies(listQuery));

  /** Change a filter; anything but the search box (which waits) goes back to page 1 at once. */
  const updateFilter = (patch: Partial<GroupLifeFilters>) => {
    setFilterCriteria((prev) => ({ ...prev, ...patch }));
    if (!("searchValue" in patch)) {
      setPage(1);
      reset();
    }
  };

  /** Enter in the search box: search now. */
  const applyFilters = () => {
    setDebouncedSearch(filterCriteria.searchValue.trim());
    setPage(1);
    reset();
  };

  const clearAllFilters = () => {
    setFilterCriteria(EMPTY);
    setDebouncedSearch("");
    setPage(1);
    reset();
  };

  const setCurrentPage = (p: number) => {
    setPage(p);
    reset();
  };

  const extraFilterCount = [filterCriteria.subRiskId !== "all", filterCriteria.startDate, filterCriteria.endDate].filter(Boolean).length;
  const hasActiveFilters = !!(filterCriteria.searchValue || filterCriteria.status !== "all" || extraFilterCount);

  return {
    filterCriteria,
    updateFilter,
    debouncedSearch,
    currentPage,
    setCurrentPage,
    refreshList,
    applyFilters,
    clearAllFilters,
    extraFilterCount,
    hasActiveFilters,
  };
};
