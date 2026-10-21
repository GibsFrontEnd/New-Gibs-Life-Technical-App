// @ts-nocheck
// The search bar, status chips and extra filters above the group-life lists. State lives in
// useGroupLifeList; this only draws it.
import { useState } from "react";
import { Filter, X } from "lucide-react";
import { FilterChips, SearchField, btnOutline, btnRow, inputBase } from "../page/PageKit";

const GroupLifeListFilters = ({
  list,
  productOptions = [],
  total,
  loading,
  noun = "scheme",
}: {
  list: any;
  productOptions?: { id: string; name: string }[];
  total?: number;
  loading?: boolean;
  noun?: string;
}) => {
  const [open, setOpen] = useState(false);
  const { filterCriteria: f, updateFilter, applyFilters, clearAllFilters, extraFilterCount, hasActiveFilters, debouncedSearch } = list;

  return (
    <>
      <div className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchField
            value={f.searchValue}
            onChange={(v) => updateFilter({ searchValue: v })}
            onEnter={applyFilters}
            placeholder="Search by scheme number or company name"
          />
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={btnOutline + " h-12"}>
            <Filter className="h-4 w-4" />
            Filters
            {extraFilterCount > 0 && <span className="rounded-full bg-[#155dfd] px-1.5 text-xs text-white">{extraFilterCount}</span>}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChips
            label="Status"
            value={f.status}
            onChange={(v) => updateFilter({ status: v })}
            options={[
              { value: "all", label: "All" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
            ]}
          />
          {hasActiveFilters && (
            <button type="button" onClick={clearAllFilters} className={btnRow}>
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </div>

        {open && (
          <div className={`grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 ${productOptions.length ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {productOptions.length > 0 && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Product</span>
                <select className={inputBase} value={f.subRiskId} onChange={(e) => updateFilter({ subRiskId: e.target.value })}>
                  <option value="all">All products</option>
                  {productOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">Start date from</span>
              <input type="date" className={inputBase} value={f.startDate} onChange={(e) => updateFilter({ startDate: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">Start date to</span>
              <input type="date" className={inputBase} value={f.endDate} onChange={(e) => updateFilter({ endDate: e.target.value })} />
            </label>
          </div>
        )}
      </div>

      {total !== undefined && (
        <p className="mb-3 text-sm text-slate-500">
          {loading
            ? "Loading…"
            : `${(total || 0).toLocaleString("en-NG")} ${noun}${total === 1 ? "" : "s"}${debouncedSearch ? ` matching “${debouncedSearch}”` : ""}`}
        </p>
      )}
    </>
  );
};

export default GroupLifeListFilters;
