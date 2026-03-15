//@ts-nocheck
"use client";

import { Input } from "@/components/UI/new-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/UI/new-select";
import { Button } from "@/components/UI/new-button";
import { Search, Filter, X } from "lucide-react";
import { BranchFiltersProps as BranchFP } from "@/types/branches";
import SearchBar from "@/components/SearchBar";

interface BranchFiltersProps {
  filters: BranchFP;
  onFiltersChange: (filters: BranchFP) => void;
}

export function BranchFilters({
  filters,
  onFiltersChange,
}: BranchFiltersProps) {
  const handleFilterChange = (key: keyof BranchFP, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      regionID: "",
      stateID: "",
      active: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  return (
    <div className="flex flex-col gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Input
            placeholder="Search branches..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.regionID}
          onValueChange={(value) => handleFilterChange("regionID", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem value="001">Region 001</SelectItem>
            <SelectItem value="002">Region 002</SelectItem>
            <SelectItem value="003">Region 003</SelectItem>
            <SelectItem value="004">Region 004</SelectItem>
            <SelectItem value="014">Region 014</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.stateID}
          onValueChange={(value) => handleFilterChange("stateID", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="15">FCT Abuja</SelectItem>
            <SelectItem value="19">Kaduna</SelectItem>
            <SelectItem value="20">Kano</SelectItem>
            <SelectItem value="25">Lagos</SelectItem>
            <SelectItem value="28">Ogun</SelectItem>
            <SelectItem value="29">Ondo</SelectItem>
            <SelectItem value="30">Osun</SelectItem>
            <SelectItem value="31">Oyo</SelectItem>
            <SelectItem value="32">Plateau</SelectItem>
            <SelectItem value="33">Rivers</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.active}
          onValueChange={(value) => handleFilterChange("active", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
