// @ts-nocheck
// hooks/useTreatyProportions.ts
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  TreatyProportion, 
  TreatyProportionFilter,
  TreatyProportionPagination,
  TreatyProportionApiError,
  TreatyProportionApiResult
} from '../types/treaty-proportion.types';
import { treatyProportionService } from '../services/treaty-proportion.service';

interface UseTreatyProportionsOptions {
  autoFetch?: boolean;
  defaultPageSize?: number;
  enableRetry?: boolean;
  retryAttempts?: number;
  retryDelayMs?: number;
}

interface UseTreatyProportionsReturn {
  treatyProportions: TreatyProportion[];
  filteredProportions: TreatyProportion[];
  selectedProportions: Set<number>;
  isLoading: boolean;
  isError: boolean;
  error: TreatyProportionApiError | null;
  pagination: TreatyProportionPagination;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  filter: TreatyProportionFilter | null;
  setFilter: (filter: TreatyProportionFilter | null) => void;
  clearFilter: () => void;
  toggleSelection: (propId: number) => void;
  toggleAllSelection: () => void;
  clearSelection: () => void;
  selectAll: () => void;
  refreshTreatyProportions: () => Promise<void>;
  deleteTreatyProportion: (subriskId: string, underYr: number) => Promise<boolean>;
  deleteSelectedTreatyProportions: () => Promise<boolean>;
  createTreatyProportion: (data: Omit<TreatyProportion, 'propID' | 'submitOn' | 'modifiedOn'>) => Promise<TreatyProportion | null>;
  updateTreatyProportion: (data: TreatyProportion) => Promise<TreatyProportion | null>;
  bulkInsertTreatyProportions: (data: Omit<TreatyProportion, 'propID' | 'submitOn' | 'modifiedOn'>[]) => Promise<boolean>;
  bulkUpdateTreatyProportions: (data: TreatyProportion[]) => Promise<boolean>;
  isDeleting: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isBulkOperating: boolean;
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

export function useTreatyProportions(
  options: UseTreatyProportionsOptions = {}
): UseTreatyProportionsReturn {
  const {
    autoFetch = true,
    defaultPageSize = DEFAULT_PAGE_SIZE,
  } = options;

  // ✅ Store options in a ref so they never cause re-renders
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // State
  const [treatyProportions, setTreatyProportions] = useState<TreatyProportion[]>([]);
  const [filter, setFilterState] = useState<TreatyProportionFilter | null>(null);
  const [pagination, setPagination] = useState<TreatyProportionPagination>({
    page: 1,
    pageSize: defaultPageSize,
    totalItems: 0,
    totalPages: 0,
  });
  const [selectedProportions, setSelectedProportions] = useState<Set<number>>(new Set());

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<TreatyProportionApiError | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false); // ✅ Prevent double-fetch on mount

 useEffect(() => {
  isMountedRef.current = true;  // ← reset on every mount
  return () => {
    isMountedRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, []);

  // ✅ withRetry uses optionsRef — empty dep array keeps it stable forever
  const withRetry = useCallback(async <T,>(
    operation: () => Promise<TreatyProportionApiResult<T>>
  ): Promise<TreatyProportionApiResult<T>> => {
    const {
      enableRetry = true,
      retryAttempts = DEFAULT_RETRY_ATTEMPTS,
      retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    } = optionsRef.current;

    let lastResult: TreatyProportionApiResult<T> | null = null;

    for (let attempt = 0; attempt <= (enableRetry ? retryAttempts : 0); attempt++) {
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Request aborted');
      }

      const result = await operation();

      if (result.success) return result;

      lastResult = result;

      // Don't retry on client errors (4xx except 429)
      if (result.status >= 400 && result.status < 500 && result.status !== 429) {
        return result;
      }

      if (attempt < retryAttempts && enableRetry) {
        await new Promise(resolve =>
          setTimeout(resolve, retryDelayMs * Math.pow(2, attempt))
        );
      }
    }

    return lastResult!;
  }, []); // ✅ Empty deps — reads options via ref

 const refreshTreatyProportions = useCallback(async () => {
  setIsLoading(true);
  setIsError(false);
  setError(null);

  try {
    const result = await treatyProportionService.getAllTreatyProportions();

    if (result.success) {
      setTreatyProportions(result.data);
    } else {
      setIsError(true);
      setError(result.error);
      setTreatyProportions([]);
    }
  } catch (err) {
    setIsError(true);
    setError({
      code: 'UNKNOWN_ERROR',
      message: err instanceof Error ? err.message : 'An unexpected error occurred',
      status: 0,
      timestamp: new Date().toISOString(),
    });
    setTreatyProportions([]);
  } finally {
    setIsLoading(false);
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Delete single treaty proportion
  const deleteTreatyProportion = useCallback(async (
    subriskId: string,
    underYr: number
  ): Promise<boolean> => {
    setIsDeleting(true);
    try {
      const result = await withRetry(() =>
        treatyProportionService.deleteTreatyProportion(subriskId, underYr)
      );
      if (result.success) {
        await refreshTreatyProportions();
        return true;
      } else {
        setError(result.error);
        setIsError(true);
        return false;
      }
    } finally {
      if (isMountedRef.current) setIsDeleting(false);
    }
  }, [withRetry, refreshTreatyProportions]);

  // Delete selected treaty proportions
  const deleteSelectedTreatyProportions = useCallback(async (): Promise<boolean> => {
    if (selectedProportions.size === 0) return false;
    setIsDeleting(true);
    try {
      const proportionsToDelete = treatyProportions.filter(p =>
        selectedProportions.has(p.propID)
      );
      const deletePromises = proportionsToDelete.map(p =>
        treatyProportionService.deleteTreatyProportion(p.subriskID, p.underYr)
      );
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every(r => r.success);
      if (allSuccessful) {
        await refreshTreatyProportions();
        setSelectedProportions(new Set());
        return true;
      } else {
        const failedResult = results.find(r => !r.success);
        if (failedResult && !failedResult.success) {
          setError(failedResult.error);
          setIsError(true);
        }
        return false;
      }
    } finally {
      if (isMountedRef.current) setIsDeleting(false);
    }
  }, [selectedProportions, treatyProportions, refreshTreatyProportions]);

  // Create treaty proportion
  const createTreatyProportion = useCallback(async (
    data: Omit<TreatyProportion, 'propID' | 'submitOn' | 'modifiedOn'>
  ): Promise<TreatyProportion | null> => {
    setIsCreating(true);
    try {
      const result = await withRetry(() =>
        treatyProportionService.createTreatyProportion(data)
      );
      if (result.success) {
        await refreshTreatyProportions();
        return result.data;
      } else {
        setError(result.error);
        setIsError(true);
        return null;
      }
    } finally {
      if (isMountedRef.current) setIsCreating(false);
    }
  }, [withRetry, refreshTreatyProportions]);

  // Update treaty proportion
  const updateTreatyProportion = useCallback(async (
    data: TreatyProportion
  ): Promise<TreatyProportion | null> => {
    setIsUpdating(true);
    try {
      const result = await withRetry(() =>
        treatyProportionService.updateTreatyProportion(data)
      );
      if (result.success) {
        await refreshTreatyProportions();
        return result.data;
      } else {
        setError(result.error);
        setIsError(true);
        return null;
      }
    } finally {
      if (isMountedRef.current) setIsUpdating(false);
    }
  }, [withRetry, refreshTreatyProportions]);

  // Bulk insert
  const bulkInsertTreatyProportions = useCallback(async (
    data: Omit<TreatyProportion, 'propID' | 'submitOn' | 'modifiedOn'>[]
  ): Promise<boolean> => {
    setIsBulkOperating(true);
    try {
      const result = await withRetry(() =>
        treatyProportionService.bulkInsertTreatyProportions(data)
      );
      if (result.success) {
        await refreshTreatyProportions();
        return true;
      } else {
        setError(result.error);
        setIsError(true);
        return false;
      }
    } finally {
      if (isMountedRef.current) setIsBulkOperating(false);
    }
  }, [withRetry, refreshTreatyProportions]);

  // Bulk update
  const bulkUpdateTreatyProportions = useCallback(async (
    data: TreatyProportion[]
  ): Promise<boolean> => {
    setIsBulkOperating(true);
    try {
      const result = await withRetry(() =>
        treatyProportionService.bulkUpdateTreatyProportions(data)
      );
      if (result.success) {
        await refreshTreatyProportions();
        return true;
      } else {
        setError(result.error);
        setIsError(true);
        return false;
      }
    } finally {
      if (isMountedRef.current) setIsBulkOperating(false);
    }
  }, [withRetry, refreshTreatyProportions]);

  // Computed filtered data
  const filteredProportions = useMemo(() => {
    if (!filter || !filter.enabled || !filter.value) {
      return treatyProportions;
    }
    return treatyProportions.filter(proportion => {
      const fieldValue = proportion[filter.field];
      if (fieldValue === undefined || fieldValue === null) return false;
      const stringValue = String(fieldValue).toLowerCase();
      const searchValue = filter.value.toLowerCase();
      switch (filter.operator) {
        case 'contains':    return stringValue.includes(searchValue);
        case 'equals':      return stringValue === searchValue;
        case 'startsWith':  return stringValue.startsWith(searchValue);
        case 'endsWith':    return stringValue.endsWith(searchValue);
        default:            return stringValue.includes(searchValue);
      }
    });
  }, [treatyProportions, filter]);

  // Update pagination when filtered data changes
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalItems: filteredProportions.length,
      totalPages: Math.max(1, Math.ceil(filteredProportions.length / prev.pageSize)),
    }));
  }, [filteredProportions]);

  // Reset to first page when filter changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filter]);

 useEffect(() => {
  if (autoFetch) {
    refreshTreatyProportions();
  }
}, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter management
  const setFilter = useCallback((newFilter: TreatyProportionFilter | null) => {
    setFilterState(newFilter);
  }, []);

  const clearFilter = useCallback(() => {
    setFilterState(null);
  }, []);

  // Selection management
  const toggleSelection = useCallback((propId: number) => {
    setSelectedProportions(prev => {
      const next = new Set(prev);
      if (next.has(propId)) {
        next.delete(propId);
      } else {
        next.add(propId);
      }
      return next;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    const currentPageIds = filteredProportions
      .slice(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize
      )
      .map(p => p.propID);

    const allSelected = currentPageIds.every(id => selectedProportions.has(id));

    if (allSelected) {
      setSelectedProportions(prev => {
        const next = new Set(prev);
        currentPageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedProportions(prev => {
        const next = new Set(prev);
        currentPageIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [filteredProportions, pagination.page, pagination.pageSize, selectedProportions]);

  const clearSelection = useCallback(() => {
    setSelectedProportions(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelectedProportions(new Set(filteredProportions.map(p => p.propID)));
  }, [filteredProportions]);

  // Pagination controls
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  return {
    treatyProportions,
    filteredProportions,
    selectedProportions,
    isLoading,
    isError,
    error,
    pagination,
    setPage,
    setPageSize,
    filter,
    setFilter,
    clearFilter,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    selectAll,
    refreshTreatyProportions,
    deleteTreatyProportion,
    deleteSelectedTreatyProportions,
    createTreatyProportion,
    updateTreatyProportion,
    bulkInsertTreatyProportions,
    bulkUpdateTreatyProportions,
    isDeleting,
    isCreating,
    isUpdating,
    isBulkOperating,
  };
}