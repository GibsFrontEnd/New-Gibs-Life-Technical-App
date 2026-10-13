"use client";

import { useState } from "react";
import { Button } from "../../../UI/new-button";
import { Label } from "../../../UI/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../UI/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../UI/table";
import { Checkbox } from "../../../UI/checkbox";
import { Badge } from "../../../UI/badge";
import { Switch } from "../../../UI/switch";
import type { SubRiskSMI } from "../../../../types/sub-risk-smis";
import { Edit, Trash2, Eye } from "lucide-react";

interface SubRiskSMITableProps {
  subRiskSMIs: SubRiskSMI[];
  onEdit: (subRiskSMI: SubRiskSMI) => void;
  onDelete: (id: number) => void;
  onView: (subRiskSMI: SubRiskSMI) => void;
  onBulkUpdateActive: (ids: number[], active: number) => void;
  onBulkUpdateFlags: (
    ids: number[],
    flags: { addSI?: number; stockItem?: number; multiplier?: number }
  ) => void;
  isLoading?: boolean;
}

export function SubRiskSMITable({
  subRiskSMIs,
  onEdit,
  onDelete,
  onView,
  onBulkUpdateActive,
  onBulkUpdateFlags,
}: SubRiskSMITableProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkActive, setBulkActive] = useState<boolean>(true);
  const [bulkFlags, setBulkFlags] = useState({
    addSI: false,
    stockItem: false,
    multiplier: false,
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(subRiskSMIs.map((item) => item.sid));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    }
  };

  const handleBulkActiveUpdate = () => {
    if (selectedIds.length > 0) {
      onBulkUpdateActive(selectedIds, bulkActive ? 1 : 0);
      setSelectedIds([]);
    }
  };

  const handleBulkFlagsUpdate = () => {
    if (selectedIds.length > 0) {
      const flags: { addSI?: number; stockItem?: number; multiplier?: number } =
        {};
      if (bulkFlags.addSI) flags.addSI = 1;
      if (bulkFlags.stockItem) flags.stockItem = 1;
      if (bulkFlags.multiplier) flags.multiplier = 1;

      onBulkUpdateFlags(selectedIds, flags);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Actions ({selectedIds.length} selected)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="bulkActive"
                  checked={bulkActive}
                  onCheckedChange={setBulkActive}
                />
                <Label htmlFor="bulkActive">Set Active Status</Label>
              </div>
              <Button   //@ts-ignore
               onClick={handleBulkActiveUpdate} size="sm">
                Update Active Status
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulkAddSI"
                  checked={bulkFlags.addSI}
                  onCheckedChange={(checked) =>
                    setBulkFlags((prev) => ({ ...prev, addSI: !!checked }))
                  }
                />
                <Label htmlFor="bulkAddSI">Add SI</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulkStockItem"
                  checked={bulkFlags.stockItem}
                  onCheckedChange={(checked) =>
                    setBulkFlags((prev) => ({ ...prev, stockItem: !!checked }))
                  }
                />
                <Label htmlFor="bulkStockItem">Stock Item</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulkMultiplier"
                  checked={bulkFlags.multiplier}
                  onCheckedChange={(checked) =>
                    setBulkFlags((prev) => ({ ...prev, multiplier: !!checked }))
                  }
                />
                <Label htmlFor="bulkMultiplier">Multiplier</Label>
              </div>
              <Button   //@ts-ignore
                onClick={handleBulkFlagsUpdate} size="sm">
                Update Flags
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedIds.length === subRiskSMIs.length &&
                        subRiskSMIs.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>SMI Code</TableHead>
                  <TableHead>Section</TableHead>
                  {/* <TableHead>SubRisk ID</TableHead> */}
                  <TableHead>SMI Details</TableHead>
                  <TableHead>Rates</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subRiskSMIs.map((item) => (
                  <TableRow key={item.sid}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(item.sid)}
                        onCheckedChange={(checked) =>
                          handleSelectItem(item.sid, !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.smiCode}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.sectionName}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.sectionCode}
                        </div>
                      </div>
                    </TableCell>
                    {/* <TableCell>
                      <div>
                        <div className="font-medium">{item.subRiskName}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.subRiskID}
                        </div>
                      </div>
                    </TableCell> */}
                    <TableCell className="max-w-xs truncate">
                      {item.smiDetails}
                    </TableCell>
                    <TableCell>{item.rates}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.addSI === 1 && (
                          <Badge variant="secondary" className="text-xs text-white">
                            SI
                          </Badge>
                        )}
                        {item.stockItem === 1 && (
                          <Badge variant="secondary" className="text-xs text-white">
                            Stock
                          </Badge>
                        )}
                        {item.multiplier === 1 && (
                          <Badge variant="secondary" className="text-xs text-white">
                            Multi
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="text-white"
                        variant={item.active === 1 ? "default" : "secondary"}
                      >
                        {item.active === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button   //@ts-ignore
                          size="sm"
                          variant="ghost"
                          onClick={() => onView(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button   //@ts-ignore
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button   //@ts-ignore
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(item.sid)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
