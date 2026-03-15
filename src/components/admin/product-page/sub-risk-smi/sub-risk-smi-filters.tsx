"use client";

import { useState } from "react";
import { Button } from "../../../UI/new-button";
import { Input } from "../../../UI/new-input";
import { Label } from "../../../UI/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../UI/card";
import { Switch } from "../../../UI/switch";
import { Checkbox } from "../../../UI/checkbox";

interface FilterOptions {
  subRiskId?: string;
  sectionCode?: string;
  smiCode?: string;
  activeOnly?: boolean;
  addSI?: boolean;
  stockItem?: boolean;
  multiplier?: boolean;
}

interface SubRiskSMIFiltersProps {
  onFilter: (filters: FilterOptions) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function SubRiskSMIFilters({
  onFilter,
  onClear,
  isLoading,
}: SubRiskSMIFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({});

  const handleFilterChange = (
    key: keyof FilterOptions,
    value: string | boolean
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    onFilter(filters);
  };

  const handleClearFilters = () => {
    setFilters({});
    onClear();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subRiskId">SubRisk ID</Label>
            <Input
              id="subRiskId"
              placeholder="Filter by SubRisk ID"
              value={filters.subRiskId || ""}
              onChange={(e) => handleFilterChange("subRiskId", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sectionCode">Section Code</Label>
            <Input
              id="sectionCode"
              placeholder="Filter by Section Code"
              value={filters.sectionCode || ""}
              onChange={(e) =>
                handleFilterChange("sectionCode", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smiCode">SMI Code</Label>
            <Input
              id="smiCode"
              placeholder="Filter by SMI Code"
              value={filters.smiCode || ""}
              onChange={(e) => handleFilterChange("smiCode", e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="activeOnly"
              checked={filters.activeOnly || false}
              onCheckedChange={(checked) =>
                handleFilterChange("activeOnly", checked)
              }
            />
            <Label htmlFor="activeOnly">Active Only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="filterAddSI"
              checked={filters.addSI || false}
              onCheckedChange={(checked) =>
                handleFilterChange("addSI", !!checked)
              }
            />
            <Label htmlFor="filterAddSI">Has Add SI</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="filterStockItem"
              checked={filters.stockItem || false}
              onCheckedChange={(checked) =>
                handleFilterChange("stockItem", !!checked)
              }
            />
            <Label htmlFor="filterStockItem">Has Stock Item</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="filterMultiplier"
              checked={filters.multiplier || false}
              onCheckedChange={(checked) =>
                handleFilterChange("multiplier", !!checked)
              }
            />
            <Label htmlFor="filterMultiplier">Has Multiplier</Label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button   //@ts-ignore
          onClick={handleApplyFilters} disabled={isLoading}>
            Apply Filters
          </Button>
          <Button   //@ts-ignore
          variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
