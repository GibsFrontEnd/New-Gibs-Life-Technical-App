// features/claims/components/ClaimFilters.tsx
//@ts-nocheck

import { useState, useEffect } from "react";
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
  autoFetch?: boolean;
}

const ClaimFilters: React.FC<ClaimFiltersProps> = ({
  filters,
  onFilterChange,
  onApply,
  onClear,
  lossTypeOptions,
  showLossType = true,
  autoFetch = true,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters =
    filters.searchText ||
    filters.dateFrom ||
    filters.dateTo ||
    (filters.lossType && filters.lossType !== "" && filters.lossType !== "all");

  const activeFilterCount = [
    filters.searchText ? "Search" : null,
    filters.dateFrom ? "Date From" : null,
    filters.dateTo ? "Date To" : null,
    filters.lossType && filters.lossType !== "" && filters.lossType !== "all" ? "Loss Type" : null,
  ].filter(Boolean).length;

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFilterChange(newFilters);
    
    // Auto-fetch when filter changes (with debounce in parent)
    if (autoFetch) {
      // We'll let the parent handle the fetch via useEffect
      // Just notify that filters changed
    }
  };

  const handleClear = () => {
    const clearedFilters = {
      searchText: "",
      dateFrom: "",
      dateTo: "",
      lossType: "",
    };
    onFilterChange(clearedFilters);
    onClear();
  };

  return (
    <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
      <div className="border rounded-lg mb-6 bg-gray-50">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Search Filter</span>
              
            </div>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
              <Checkbox checked={filtersOpen} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block font-medium">
                  Search
                </label>
                <Input
                  value={filters.searchText || ""}
                  onChange={(e) =>
                    handleFilterChange("searchText", e.target.value)
                  }
                  placeholder="Policy No, Claim No, Insured..."
                  className="w-full"
                />
                {filters.searchText && (
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    Searching: "{filters.searchText}"
                  </p>
                )}
              </div>

              {/* Loss Type - Only show if enabled */}
              {showLossType && (
                <div>
                  <label className="text-sm text-gray-600 mb-1 block font-medium">
                    Loss Type
                  </label>
                  <Select
                    value={filters.lossType || ""}
                    onValueChange={(value) =>
                      handleFilterChange("lossType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {lossTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date From */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block font-medium">
                  Date From
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) =>
                    handleFilterChange("dateFrom", e.target.value)
                  }
                  className="w-full"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block font-medium">
                  Date To
                </label>
                <Input
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) =>
                    handleFilterChange("dateTo", e.target.value)
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex flex-wrap justify-between items-center gap-2 mt-4 pt-2 border-t border-gray-200">
             
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={handleClear}
                  disabled={!hasActiveFilters}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    console.log("🔍 Apply button clicked - fetching claims");
                    onApply();
                  }}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default ClaimFilters;