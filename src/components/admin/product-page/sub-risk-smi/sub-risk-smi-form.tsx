"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "../../../UI/new-button";
import { Input } from "../../../UI/new-input";
import { Label } from "../../../UI/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../UI/card";
import { Switch } from "../../../UI/switch";
import { Textarea } from "../../../UI/textarea";
import type {
  SubRiskSMI,
  SubRiskSMICreateUpdateRequest,
} from "../../../../types/sub-risk-smis";

interface SubRiskSMIFormProps {
  subRiskSMI?: SubRiskSMI | null;
  onSubmit: (data: SubRiskSMICreateUpdateRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SubRiskSMIForm({
  subRiskSMI,
  onSubmit,
  onCancel,
  isLoading,
}: SubRiskSMIFormProps) {
  const [formData, setFormData] = useState<SubRiskSMICreateUpdateRequest>({
    smiCode: "",
    sectionCode: "",
    subRiskID: "",
    smiDetails: "",
    sectionName: "",
    subRiskName: "",
    field1: "",
    field2: "",
    rates: 0,
    addSI: 0,
    stockItem: 0,
    multiplier: 0,
    a1: 0,
    a2: 0,
    a3: 0,
    a4: 0,
    a5: 0,
    active: 1,
    submittedBy: "current-user",
  });

  useEffect(() => {
    if (subRiskSMI) {
      setFormData({
        smiCode: subRiskSMI.smiCode,
        sectionCode: subRiskSMI.sectionCode,
        subRiskID: subRiskSMI.subRiskID,
        smiDetails: subRiskSMI.smiDetails,
        sectionName: subRiskSMI.sectionName,
        subRiskName: subRiskSMI.subRiskName,
        field1: subRiskSMI.field1,
        field2: subRiskSMI.field2,
        rates: subRiskSMI.rates || 0,
        addSI: subRiskSMI.addSI || 0,
        stockItem: subRiskSMI.stockItem || 0,
        multiplier: subRiskSMI.multiplier || 0,
        a1: subRiskSMI.a1 || 0,
        a2: subRiskSMI.a2 || 0,
        a3: subRiskSMI.a3 || 0,
        a4: subRiskSMI.a4 || 0,
        a5: subRiskSMI.a5 || 0,
        active: subRiskSMI.active || 1,
        submittedBy: subRiskSMI.submittedBy,
        modifiedBy: "current-user",
      });
    }
  }, [subRiskSMI]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (
    field: keyof SubRiskSMICreateUpdateRequest,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>
          {subRiskSMI ? "Edit SubRisk SMI" : "Create SubRisk SMI"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smiCode">SMI Code</Label>
              <Input
                id="smiCode"
                value={formData.smiCode}
                onChange={(e) => handleInputChange("smiCode", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionCode">Section Code</Label>
              <Input
                id="sectionCode"
                value={formData.sectionCode}
                onChange={(e) =>
                  handleInputChange("sectionCode", e.target.value)
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subRiskID">SubRisk ID</Label>
              <Input
                id="subRiskID"
                value={formData.subRiskID}
                onChange={(e) => handleInputChange("subRiskID", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionName">Section Name</Label>
              <Input
                id="sectionName"
                value={formData.sectionName}
                onChange={(e) =>
                  handleInputChange("sectionName", e.target.value)
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subRiskName">SubRisk Name</Label>
              <Input
                id="subRiskName"
                value={formData.subRiskName}
                onChange={(e) =>
                  handleInputChange("subRiskName", e.target.value)
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field1">Field 1</Label>
              <Input
                id="field1"
                value={formData.field1}
                onChange={(e) => handleInputChange("field1", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field2">Field 2</Label>
              <Input
                id="field2"
                value={formData.field2}
                onChange={(e) => handleInputChange("field2", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smiDetails">SMI Details</Label>
            <Textarea
              id="smiDetails"
              value={formData.smiDetails}
              onChange={(e) => handleInputChange("smiDetails", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rates">Rates</Label>
              <Input
                id="rates"
                type="number"
                step="0.01"
                value={formData.rates}
                onChange={(e) =>
                  handleInputChange(
                    "rates",
                    Number.parseFloat(e.target.value) || 0
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="multiplier">Multiplier</Label>
              <Input
                id="multiplier"
                type="number"
                step="0.01"
                value={formData.multiplier}
                onChange={(e) =>
                  handleInputChange(
                    "multiplier",
                    Number.parseFloat(e.target.value) || 0
                  )
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="addSI"
                checked={formData.addSI === 1}
                onCheckedChange={(checked) =>
                  handleInputChange("addSI", checked ? 1 : 0)
                }
              />
              <Label htmlFor="addSI">Add SI</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="stockItem"
                checked={formData.stockItem === 1}
                onCheckedChange={(checked) =>
                  handleInputChange("stockItem", checked ? 1 : 0)
                }
              />
              <Label htmlFor="stockItem">Stock Item</Label>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="space-y-2">
                <Label htmlFor={`a${num}`}>A{num}</Label>
                <Input
                  id={`a${num}`}
                  type="number"
                  step="0.01"
                  value={
                    formData[
                      `a${num}` as keyof SubRiskSMICreateUpdateRequest
                    ] as number
                  }
                  onChange={(e) =>
                    handleInputChange(
                      `a${num}` as keyof SubRiskSMICreateUpdateRequest,
                      Number.parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active === 1}
              onCheckedChange={(checked) =>
                handleInputChange("active", checked ? 1 : 0)
              }
            />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="flex gap-4">
            <Button //@ts-ignore
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : subRiskSMI ? "Update" : "Create"}
            </Button>
            <Button //@ts-ignore
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
