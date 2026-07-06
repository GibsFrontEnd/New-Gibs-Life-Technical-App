// features/claims/components/ClaimFilters.tsx
//@ts-nocheck

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../UI/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/new-select";
import { Input } from "../UI/new-input";
import { Filter, Search, X } from "lucide-react";
import { Button } from "../UI/new-button";
import { Badge } from "../UI/badge";
import { Checkbox } from "../UI/checkbox";

interface ClaimFiltersProps {
  filters: {
    searchText: string;
    dateFrom: string;
    dateTo: string;
    lossType: string;
  };
  onFilterChange: (filters: any) => void;
  onApply: () => void;
  onClear: () => void;
  lossTypeOptions: { label: string; value: string }[];
  showLossType?: boolean;
}

export const ClaimFilters: React.FC<ClaimFiltersProps> = ({
  filters,
  onFilterChange,
  onApply,
  onClear,
  lossTypeOptions,
  showLossType = true,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters =
    filters.searchText ||
    filters.dateFrom ||
    filters.dateTo ||
    (filters.lossType && filters.lossType !== "all");

  const activeFilterCount = [
    filters.searchText,
    filters.dateFrom,
    filters.dateTo,
    filters.lossType !== "all" ? filters.lossType : null,
  ].filter(Boolean).length;

  const handleFilterChange = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
      <div className="border rounded-lg mb-6 bg-gray-50">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Search Filter</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
              <Checkbox checked={filtersOpen} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Search
                </label>
                <Input
                  value={filters.searchText}
                  onChange={(e) =>
                    handleFilterChange("searchText", e.target.value)
                  }
                  placeholder="Search by policy or insured..."
                  className="w-full"
                />
              </div>
              {showLossType && (
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Loss Type
                  </label>
                  <Select
                    value={filters.lossType}
                    onValueChange={(value) =>
                      handleFilterChange("lossType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {lossTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Date From
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    handleFilterChange("dateFrom", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Date To
                </label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    handleFilterChange("dateTo", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                className="bg-transparent"
                onClick={onClear}
              >
                Clear Filters
              </Button>
              <Button
                className="bg-primary hover:bg-primary-blue"
                onClick={onApply}
              >
                <Search className="w-4 h-4 mr-2" />
                Apply
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};