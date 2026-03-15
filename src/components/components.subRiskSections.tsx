"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "../hooks/use-apps"
import { Button } from "./UI/new-button"
import  Input  from "./UI/Input"
import { Label } from "./UI/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./UI/dialog"
import {
  selectUiState,
  setShowCreateSubRiskSectionDialog,
  setShowEditSubRiskSectionDialog,
} from "../features/reducers/uiReducers/uiSlice"
import {
  createSubRiskSection,
  updateSubRiskSection,
  selectSubRiskSections,
  clearMessages,
} from "../features/reducers/productReducers/subRiskSectionSlice"
import type { SubRiskSection, CreateSubRiskSectionRequest, UpdateSubRiskSectionRequest } from "../types/subRiskSection"

export const CreateSubRiskSection = () => {
  const dispatch = useAppDispatch()
  const { showCreateSubRiskSectionDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectSubRiskSections)

  const [formData, setFormData] = useState<CreateSubRiskSectionRequest>({
    sectionCode: "",
    subRiskID: "",
    sectionName: "",
    subRiskName: "",
    field1: "",
    field2: "",
    rates: 0,
    a1: 0,
    a2: 0,
    a3: 0,
    a4: 0,
    a5: 0,
    submittedBy: "",
  })

  const [errors, setErrors] = useState<Partial<CreateSubRiskSectionRequest>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const newErrors: Partial<CreateSubRiskSectionRequest> = {}
    if (!formData.sectionCode.trim()) {
      newErrors.sectionCode = "Section code is required"
    }
    if (!formData.subRiskID.trim()) {
      newErrors.subRiskID = "Sub risk ID is required"
    }
    if (!formData.sectionName.trim()) {
      newErrors.sectionName = "Section name is required"
    }
    if (!formData.subRiskName.trim()) {
      newErrors.subRiskName = "Sub risk name is required"
    }
    if (!formData.field1.trim()) {
      newErrors.field1 = "Field1 is required"
    }
    if (!formData.submittedBy.trim()) {
      newErrors.submittedBy = "Submitted by is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(createSubRiskSection(formData))
  }

  const handleClose = () => {
    setFormData({
      sectionCode: "",
      subRiskID: "",
      sectionName: "",
      subRiskName: "",
      field1: "",
      field2: "",
      rates: 0,
      a1: 0,
      a2: 0,
      a3: 0,
      a4: 0,
      a5: 0,
      submittedBy: "",
    })
    setErrors({})
    dispatch(setShowCreateSubRiskSectionDialog(false))
  }

  const handleChange =
    (field: keyof CreateSubRiskSectionRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.type === "number" ? Number(e.target.value) : e.target.value
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))

      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }))
      }
    }

  useEffect(() => {
    if (success.createSubRiskSection) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.createSubRiskSection, dispatch])

  return (
    <Dialog open={showCreateSubRiskSectionDialog} onOpenChange={handleClose}>
      <DialogContent className="subrisk-sections-create-dialog">
        <DialogHeader>
          <DialogTitle>Create New Sub Risk Section</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="subrisk-sections-form">
          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="sectionCode">Section Code *</Label>
              <Input
                id="sectionCode"
                value={formData.sectionCode}
                onChange={handleChange("sectionCode")}
                placeholder="Enter section code"
                className={errors.sectionCode ? "error" : ""}
              />
              {errors.sectionCode && <span className="subrisk-sections-error-text">{errors.sectionCode}</span>}
            </div>

            <div className="subrisk-sections-form-field">
              <Label htmlFor="subRiskID">Sub Risk ID *</Label>
              <Input
                id="subRiskID"
                value={formData.subRiskID}
                onChange={handleChange("subRiskID")}
                placeholder="Enter sub risk ID"
                className={errors.subRiskID ? "error" : ""}
              />
              {errors.subRiskID && <span className="subrisk-sections-error-text">{errors.subRiskID}</span>}
            </div>
          </div>

          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="sectionName">Section Name *</Label>
              <Input
                id="sectionName"
                value={formData.sectionName}
                onChange={handleChange("sectionName")}
                placeholder="Enter section name"
                className={errors.sectionName ? "error" : ""}
              />
              {errors.sectionName && <span className="subrisk-sections-error-text">{errors.sectionName}</span>}
            </div>

            <div className="subrisk-sections-form-field">
              <Label htmlFor="subRiskName">Sub Risk Name *</Label>
              <Input
                id="subRiskName"
                value={formData.subRiskName}
                onChange={handleChange("subRiskName")}
                placeholder="Enter sub risk name"
                className={errors.subRiskName ? "error" : ""}
              />
              {errors.subRiskName && <span className="subrisk-sections-error-text">{errors.subRiskName}</span>}
            </div>
          </div>

          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="field1">Field1 *</Label>
              <Input
                id="field1"
                value={formData.field1}
                onChange={handleChange("field1")}
                placeholder="Enter field1"
                className={errors.field1 ? "error" : ""}
              />
              {errors.field1 && <span className="subrisk-sections-error-text">{errors.field1}</span>}
            </div>

            <div className="subrisk-sections-form-field">
              <Label htmlFor="field2">Field2</Label>
              <Input
                id="field2"
                value={formData.field2}
                onChange={handleChange("field2")}
                placeholder="Enter field2 (optional)"
              />
            </div>
          </div>

          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="rates">Rates</Label>
              <Input
                id="rates"
                type="number"   //@ts-ignore
                value={formData.rates}
                onChange={handleChange("rates")}
                placeholder="Enter rates"
              />
            </div>

            <div className="subrisk-sections-form-field">
              <Label htmlFor="submittedBy">Submitted By *</Label>
              <Input
                id="submittedBy"
                value={formData.submittedBy}
                onChange={handleChange("submittedBy")}
                placeholder="Enter submitted by"
                className={errors.submittedBy ? "error" : ""}
              />
              {errors.submittedBy && <span className="subrisk-sections-error-text">{errors.submittedBy}</span>}
            </div>
          </div>

          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="a1">A1</Label>
              <Input
                id="a1"
                type="number"   //@ts-ignore
                value={formData.a1}
                onChange={handleChange("a1")}
                placeholder="Enter A1 value"
              />
            </div>

            <div className="subrisk-sections-form-field">
              <Label htmlFor="a2">A2</Label>
              <Input
                id="a2"
                type="number"   //@ts-ignore
                value={formData.a2} 
                onChange={handleChange("a2")}
                placeholder="Enter A2 value"
              />
            </div>
          </div>

          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="a3">A3</Label>
              <Input
                id="a3"
                type="number"   //@ts-ignore
                value={formData.a3}
                onChange={handleChange("a3")}
                placeholder="Enter A3 value"
              />
            </div>

            <div className="subrisk-sections-form-field">
              <Label htmlFor="a4">A4</Label>
              <Input
                id="a4"
                type="number"   //@ts-ignore
                value={formData.a4}
                onChange={handleChange("a4")}
                placeholder="Enter A4 value"
              />
            </div>
          </div>

          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="a5">A5</Label>
              <Input
                id="a5"
                type="number"   //@ts-ignore
                value={formData.a5}
                onChange={handleChange("a5")}
                placeholder="Enter A5 value"
              />
            </div>
          </div>

          {error.createSubRiskSection && (
            <div className="subrisk-sections-error-message">{error.createSubRiskSection}</div>
          )}

          <div className="subrisk-sections-form-actions">
            <Button   //@ts-ignore
             type="button" variant="outline" onClick={handleClose} disabled={loading.createSubRiskSection}>
              Cancel
            </Button>
            <Button   //@ts-ignore
             type="submit" disabled={loading.createSubRiskSection} className="subrisk-sections-submit-btn">
              {loading.createSubRiskSection ? "Creating..." : "Create Sub Risk Section"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const EditSubRiskSection = ({ subRiskSection }: { subRiskSection: SubRiskSection | null }) => {
  const dispatch = useAppDispatch()
  const { showEditSubRiskSectionDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectSubRiskSections)

  const [formData, setFormData] = useState<UpdateSubRiskSectionRequest>({
    sectionCode: "",
    subRiskID: "",
    sectionName: "",
    subRiskName: "",
    field1: "",
    field2: "",
    rates: 0,
    a1: 0,
    a2: 0,
    a3: 0,
    a4: 0,
    a5: 0,
    active: 1,
    modifiedBy: "",
  })

  const [errors, setErrors] = useState<Partial<UpdateSubRiskSectionRequest>>({})

  useEffect(() => {
    if (subRiskSection) {
      setFormData({
        sectionCode: subRiskSection.sectionCode || "",
        subRiskID: subRiskSection.subRiskID || "",
        sectionName: subRiskSection.sectionName || "",
        subRiskName: subRiskSection.subRiskName || "",
        field1: subRiskSection.field1 || "",
        field2: subRiskSection.field2 || "",
        rates: subRiskSection.rates || 0,
        a1: subRiskSection.a1 || 0,
        a2: subRiskSection.a2 || 0,
        a3: subRiskSection.a3 || 0,
        a4: subRiskSection.a4 || 0,
        a5: subRiskSection.a5 || 0,
        active: subRiskSection.active || 1,
        modifiedBy: "",
      })
    }
  }, [subRiskSection])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!subRiskSection) return

    // Validation
    const newErrors: Partial<UpdateSubRiskSectionRequest> = {}
    if (!formData.sectionCode.trim()) {
      newErrors.sectionCode = "Section code is required"
    }
    if (!formData.subRiskID.trim()) {
      newErrors.subRiskID = "Sub risk ID is required"
    }
    if (!formData.sectionName.trim()) {
      newErrors.sectionName = "Section name is required"
    }
    if (!formData.subRiskName.trim()) {
      newErrors.subRiskName = "Sub risk name is required"
    }
    if (!formData.field1.trim()) {
      newErrors.field1 = "Field1 is required"
    }
    if (!formData.modifiedBy.trim()) {
      newErrors.modifiedBy = "Modified by is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(updateSubRiskSection({ id: subRiskSection.sectionID, subRiskSectionData: formData }))
  }

  const handleClose = () => {
    setFormData({
      sectionCode: "",
      subRiskID: "",
      sectionName: "",
      subRiskName: "",
      field1: "",
      field2: "",
      rates: 0,
      a1: 0,
      a2: 0,
      a3: 0,
      a4: 0,
      a5: 0,
      active: 1,
      modifiedBy: "",
    })
    setErrors({})
    dispatch(setShowEditSubRiskSectionDialog(false))
  }

  const handleChange =
    (field: keyof UpdateSubRiskSectionRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === "number" ? Number(e.target.value) : e.target.value
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))

      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }))
      }
    }

  useEffect(() => {
    if (success.updateSubRiskSection) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.updateSubRiskSection, dispatch])

  return (
    <Dialog open={showEditSubRiskSectionDialog} onOpenChange={handleClose}>
      <DialogContent className="subrisk-sections-edit-dialog">
        <DialogHeader>
          <DialogTitle>Edit Sub Risk Section - {subRiskSection?.sectionID}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="subrisk-sections-form">
          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="editSectionCode">Section Code *</Label>
              <Input
                id="editSectionCode"
                value={formData.sectionCode}
                onChange={handleChange("sectionCode")}
                placeholder="Enter section code"
                className={errors.sectionCode ? "error" : ""}
              />
              {errors.sectionCode && <span className="subrisk-sections-error-text">{errors.sectionCode}</span>}
            </div>

            <div className="subrisk-sections-form-field">
              <Label htmlFor="editSubRiskID">Sub Risk ID *</Label>
              <Input
                id="editSubRiskID"
                value={formData.subRiskID}
                onChange={handleChange("subRiskID")}
                placeholder="Enter sub risk ID"
                className={errors.subRiskID ? "error" : ""}
              />
              {errors.subRiskID && <span className="subrisk-sections-error-text">{errors.subRiskID}</span>}
            </div>
          </div>

          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="editSectionName">Section Name *</Label>
              <Input
                id="editSectionName"
                value={formData.sectionName}
                onChange={handleChange("sectionName")}
                placeholder="Enter section name"
                className={errors.sectionName ? "error" : ""}
              />
              {errors.sectionName && <span className="subrisk-sections-error-text">{errors.sectionName}</span>}
            </div>

            <div className="subrisk-sections-form-field">
              <Label htmlFor="editSubRiskName">Sub Risk Name *</Label>
              <Input
                id="editSubRiskName"
                value={formData.subRiskName}
                onChange={handleChange("subRiskName")}
                placeholder="Enter sub risk name"
                className={errors.subRiskName ? "error" : ""}
              />
              {errors.subRiskName && <span className="subrisk-sections-error-text">{errors.subRiskName}</span>}
            </div>
          </div>

          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="editField1">Field1 *</Label>
              <Input
                id="editField1"
                value={formData.field1}
                onChange={handleChange("field1")}
                placeholder="Enter field1"
                className={errors.field1 ? "error" : ""}
              />
              {errors.field1 && <span className="subrisk-sections-error-text">{errors.field1}</span>}
            </div>

            <div className="subrisk-sections-form-field">
              <Label htmlFor="editField2">Field2</Label>
              <Input
                id="editField2"
                value={formData.field2}
                onChange={handleChange("field2")}
                placeholder="Enter field2 (optional)"
              />
            </div>
          </div>

          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="editRates">Rates</Label>
              <Input
                id="editRates"
                type="number"   //@ts-ignore
                value={formData.rates}
                onChange={handleChange("rates")}
                placeholder="Enter rates"
              />
            </div>

            <div className="subrisk-sections-form-field">
              <Label htmlFor="editActive">Active Status *</Label>
              <select
                id="editActive"
                value={formData.active}
                onChange={handleChange("active")}
                className="subrisk-sections-form-select"
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>

          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="editA1">A1</Label>
              <Input
                id="editA1"
                type="number"   //@ts-ignore
                value={formData.a1}  
                onChange={handleChange("a1")}
                placeholder="Enter A1 value"
              />
            </div>

            <div className="subrisk-sections-form-field">
              <Label htmlFor="editA2">A2</Label>
              <Input
                id="editA2"
                type="number"   //@ts-ignore
                value={formData.a2}
                onChange={handleChange("a2")}
                placeholder="Enter A2 value"
              />
            </div>
          </div>

          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="editA3">A3</Label>
              <Input
                id="editA3"
                type="number"   //@ts-ignore
                value={formData.a3}
                onChange={handleChange("a3")}
                placeholder="Enter A3 value"
              />
            </div>

            <div className="subrisk-sections-form-field">
              <Label htmlFor="editA4">A4</Label>
              <Input
                id="editA4"
                type="number"   //@ts-ignore
                value={formData.a4}
                onChange={handleChange("a4")}
                placeholder="Enter A4 value"
              />
            </div>
          </div>

          <div className="subrisk-sections-form-row">
            <div className="subrisk-sections-form-field">
              <Label htmlFor="editA5">A5</Label>
              <Input
                id="editA5"
                type="number"   //@ts-ignore
                value={formData.a5}
                onChange={handleChange("a5")}
                placeholder="Enter A5 value"
              />
            </div>

            <div className="subrisk-sections-form-field">
              <Label htmlFor="editModifiedBy">Modified By *</Label>
              <Input
                id="editModifiedBy"
                value={formData.modifiedBy}
                onChange={handleChange("modifiedBy")}
                placeholder="Enter modified by"
                className={errors.modifiedBy ? "error" : ""}
              />
              {errors.modifiedBy && <span className="subrisk-sections-error-text">{errors.modifiedBy}</span>}
            </div>
          </div>

          {error.updateSubRiskSection && (
            <div className="subrisk-sections-error-message">{error.updateSubRiskSection}</div>
          )}

          <div className="subrisk-sections-form-actions">
            <Button 
              //@ts-ignore
type="button" variant="outline" onClick={handleClose} disabled={loading.updateSubRiskSection}>
              Cancel
            </Button>
            <Button
              //@ts-ignore
 type="submit" disabled={loading.updateSubRiskSection} className="subrisk-sections-submit-btn">
              {loading.updateSubRiskSection ? "Updating..." : "Update Sub Risk Section"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
