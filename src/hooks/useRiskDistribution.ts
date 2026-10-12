// hooks/useRiskDistribution.ts
//@ts-nocheck
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../features/store';
import {
  fetchAllRiskDistributions,
  fetchRiskDistributionById,
  fetchRiskDistributionsBySubRisk,
  fetchRiskDistributionBySubRiskAndYear,
  createRiskDistribution,
  updateRiskDistribution,
  deleteRiskDistribution,
  setFilters,
  clearFilters,
  clearSelectedItem,
  clearError,
} from '../features/reducers/reinsuranceReducers/riskDistributionSlice';
import { CreateRiskDistributionDto, UpdateRiskDistributionDto } from '../types/riskDistribution';

export const useRiskDistribution = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, selectedItem, loading, error, filters } = useSelector(
    (state: RootState) => state.riskDistribution
  );

  const getAll = () => {
    dispatch(fetchAllRiskDistributions())
  };

  const getById = (id: number) => {
    dispatch(fetchRiskDistributionById(id));
  };

  const getBySubRisk = (subRiskId: string) => {
    dispatch(fetchRiskDistributionsBySubRisk(subRiskId));
  };

  const getBySubRiskAndYear = (subRiskId: string, underYr: string) => {
    dispatch(fetchRiskDistributionBySubRiskAndYear({ subRiskId, underYr }));
  };

  const create = (data: CreateRiskDistributionDto) => {
    dispatch(createRiskDistribution(data));
  };

  const update = (id: number, data: UpdateRiskDistributionDto) => {
    dispatch(updateRiskDistribution({ id, data }));
  };

  const remove = (id: number) => {
    dispatch(deleteRiskDistribution(id));
  };

  const applyFilters = (subRiskId?: string, year?: string) => {
    dispatch(setFilters({ subRiskId, year }));
  };

  const resetFilters = () => {
    dispatch(clearFilters());
  };

  const clearSelected = () => {
    dispatch(clearSelectedItem());
  };

  const resetError = () => {
    dispatch(clearError());
  };

  // Filtered items based on current filters
  const filteredItems = items.filter(item => {
    if (filters.subRiskId && item.subRiskID !== filters.subRiskId) return false;
    if (filters.year && item.underYr !== filters.year) return false;
    return true;
  });

  return {
    // State
    items,
    filteredItems,
    selectedItem,
    loading,
    error,
    filters,
    
    // Actions
    getAll,
    getById,
    getBySubRisk,
    getBySubRiskAndYear,
    create,
    update,
    remove,
    applyFilters,
    resetFilters,
    clearSelected,
    resetError,
  };
};