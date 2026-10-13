//@ts-nocheck
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "../hooks/use-apps"
import { Button } from "./UI/new-button"
import Input from "./UI/Input"
import { Label } from "./UI/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./UI/dialog"
import {
  selectUiState,
  setShowCreateRegionDialog,
  setShowEditRegionDialog,
} from "../features/reducers/uiReducers/uiSlice"
import {
  createRegion,
  updateRegion,
  selectRegions,
  clearMessages,
} from "../features/reducers/productReducers/regionSlice"
import type { Region, CreateRegionRequest, UpdateRegionRequest } from "../types/region"

export const CreateRegion = () => {
  const dispatch = useAppDispatch()
  const { showCreateRegionDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectRegions)

  const [formData, setFormData] = useState<CreateRegionRequest>({
    regionID: "",
    region: "",
    manager: "",
    address: "",
    mobilePhone: "",
    landPhone: "",
    email: "",
    fax: "",
    remarks: "",
    deleted: false,
    active: true,
    submittedBy: "",
  })

  const [errors, setErrors] = useState<Partial<CreateRegionRequest>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const newErrors: Partial<CreateRegionRequest> = {}
    if (!formData.regionID.trim()) {
      newErrors.region = "RegionID is required"
    }
    if (!formData.region.trim()) {
      newErrors.region = "Region is required"
    }
    if (!formData.manager.trim()) {
      newErrors.manager = "Manager is required"
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }
    if (!formData.submittedBy.trim()) {
      newErrors.submittedBy = "Submitted by is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(createRegion(formData))
  }

  const handleClose = () => {
    setFormData({
      regionID: "",
      region: "",
      manager: "",
      address: "",
      mobilePhone: "",
      landPhone: "",
      email: "",
      fax: "",
      remarks: "",
      deleted: false,
      active: true,
      submittedBy: "",
    })
    setErrors({})
    dispatch(setShowCreateRegionDialog(false))
  }

  const handleChange =
    (field: keyof CreateRegionRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let value: any = e.target.value
      
      // Handle boolean fields
      if (field === "deleted" || field === "active") {
        value = e.target.value === "true"
      }
      
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
    if (success.createRegion) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.createRegion, dispatch])

  return (
    <Dialog open={showCreateRegionDialog} onOpenChange={handleClose}>
      <DialogContent className="region-create-dialog max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Region</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="region-form space-y-4 p-6 ">
          <div className="region-form-row grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="region-form-field">
              <Label htmlFor="regionID">RegionID *</Label>
              <Input
                id="regionID"
                value={formData.regionID}
                onChange={handleChange("regionID")}
                placeholder="Enter region ID"
                className={errors.regionID  ? "error" : ""}
              />
              {errors.region && <span className="region-error-text text-red-500 text-sm">{errors.region}</span>}
            </div>
            <div className="region-form-field">
              <Label htmlFor="region">Region *</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={handleChange("region")}
                placeholder="Enter region name"
                className={errors.region ? "error" : ""}
              />
              {errors.region && <span className="region-error-text text-red-500 text-sm">{errors.region}</span>}
            </div>

            <div className="region-form-field">
              <Label htmlFor="manager">Manager *</Label>
              <Input
                id="manager"
                value={formData.manager}
                onChange={handleChange("manager")}
                placeholder="Enter manager name"
                className={errors.manager ? "error" : ""}
              />
              {errors.manager && <span className="region-error-text text-red-500 text-sm">{errors.manager}</span>}
            </div>
          </div>

          <div className="region-form-field">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={handleChange("address")}
              placeholder="Enter address"
              className={errors.address ? "error" : ""}
            />
            {errors.address && <span className="region-error-text text-red-500 text-sm">{errors.address}</span>}
          </div>

          <div className="region-form-row grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="region-form-field">
              <Label htmlFor="mobilePhone">Mobile Phone</Label>
              <Input
                id="mobilePhone"
                value={formData.mobilePhone}
                onChange={handleChange("mobilePhone")}
                placeholder="Enter mobile phone"
              />
            </div>

            <div className="region-form-field">
              <Label htmlFor="landPhone">Land Phone</Label>
              <Input
                id="landPhone"
                value={formData.landPhone}
                onChange={handleChange("landPhone")}
                placeholder="Enter land phone"
              />
            </div>
          </div>

          <div className="region-form-row grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="region-form-field">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                placeholder="Enter email"
                className={errors.email ? "error" : ""}
              />
              {errors.email && <span className="region-error-text text-red-500 text-sm">{errors.email}</span>}
            </div>

            <div className="region-form-field">
              <Label htmlFor="fax">Fax</Label>
              <Input
                id="fax"
                value={formData.fax}
                onChange={handleChange("fax")}
                placeholder="Enter fax"
              />
            </div>
          </div>

          <div className="region-form-field">
            <Label htmlFor="remarks">Remarks</Label>
            <textarea
              id="remarks"
              value={formData.remarks}
              onChange={handleChange("remarks")}
              placeholder="Enter remarks"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="region-form-row grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="region-form-field">
              <Label htmlFor="active">Active Status</Label>
              <select
                id="active"
                value={formData.active ? "true" : "false"}
                onChange={handleChange("active")}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="region-form-field">
              <Label htmlFor="submittedBy">Submitted By *</Label>
              <Input
                id="submittedBy"
                value={formData.submittedBy}
                onChange={handleChange("submittedBy")}
                placeholder="Enter submitted by"
                className={errors.submittedBy ? "error" : ""}
              />
              {errors.submittedBy && <span className="region-error-text text-red-500 text-sm">{errors.submittedBy}</span>}
            </div>
          </div>

          {error.createRegion && (
            <div className="region-error-message text-red-500 p-2 bg-red-50 rounded-md">{error.createRegion}</div>
          )}

          <div className="region-form-actions flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading.createRegion}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading.createRegion}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading.createRegion ? "Creating..." : "Create Region"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const EditRegion = ({ region }: { region: Region | null }) => {
  const dispatch = useAppDispatch()
  const { showEditRegionDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectRegions)

  const [formData, setFormData] = useState<UpdateRegionRequest>({
    regionID: "",
    region: "",
    manager: "",
    address: "",
    mobilePhone: "",
    landPhone: "",
    email: "",
    fax: "",
    remarks: "",
    deleted: false,
    active: true,
    submittedBy: "",
    modifiedBy: "",
  })

  const [errors, setErrors] = useState<Partial<UpdateRegionRequest>>({})

  useEffect(() => {
    if (region) {
      setFormData({
        regionID: region.regionID || "",
        region: region.region || "",
        manager: region.manager || "",
        address: region.address || "",
        mobilePhone: region.mobilePhone || "",
        landPhone: region.landPhone || "",
        email: region.email || "",
        fax: region.fax || "",
        remarks: region.remarks || "",
        deleted: region.deleted || false,
        active: region.active || true,
        submittedBy: region.submittedBy || "",
        modifiedBy: "",
      })
    }
  }, [region])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!region) return

    // Validation
    const newErrors: Partial<UpdateRegionRequest> = {}
    if (!formData.region.trim()) {
      newErrors.region = "Region is required"
    }
    if (!formData.manager.trim()) {
      newErrors.manager = "Manager is required"
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }
    if (!formData.modifiedBy.trim()) {
      newErrors.modifiedBy = "Modified by is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(updateRegion(formData))
  }

  const handleClose = () => {
    setFormData({
      regionID: "",
      region: "",
      manager: "",
      address: "",
      mobilePhone: "",
      landPhone: "",
      email: "",
      fax: "",
      remarks: "",
      deleted: false,
      active: true,
      submittedBy: "",
      modifiedBy: "",
    })
    setErrors({})
    dispatch(setShowEditRegionDialog(false))
  }

  const handleChange =
    (field: keyof UpdateRegionRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      let value: any = e.target.value
      
      // Handle boolean fields
      if (field === "deleted" || field === "active") {
        value = e.target.value === "true"
      }
      
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
    if (success.updateRegion) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.updateRegion, dispatch])

  return (
    <Dialog open={showEditRegionDialog} onOpenChange={handleClose}>
      <DialogContent className="region-edit-dialog max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Region - {region?.regionID}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="region-form space-y-4 p-6 ">
          <div className="region-form-row grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="region-form-field">
              <Label htmlFor="editRegion">Region *</Label>
              <Input
                id="editRegion"
                value={formData.region}
                onChange={handleChange("region")}
                placeholder="Enter region name"
                className={errors.region ? "error" : ""}
              />
              {errors.region && <span className="region-error-text text-red-500 text-sm">{errors.region}</span>}
            </div>

            <div className="region-form-field">
              <Label htmlFor="editManager">Manager *</Label>
              <Input
                id="editManager"
                value={formData.manager}
                onChange={handleChange("manager")}
                placeholder="Enter manager name"
                className={errors.manager ? "error" : ""}
              />
              {errors.manager && <span className="region-error-text text-red-500 text-sm">{errors.manager}</span>}
            </div>
          </div>

          <div className="region-form-field">
            <Label htmlFor="editAddress">Address *</Label>
            <Input
              id="editAddress"
              value={formData.address}
              onChange={handleChange("address")}
              placeholder="Enter address"
              className={errors.address ? "error" : ""}
            />
            {errors.address && <span className="region-error-text text-red-500 text-sm">{errors.address}</span>}
          </div>

          <div className="region-form-row grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="region-form-field">
              <Label htmlFor="editMobilePhone">Mobile Phone</Label>
              <Input
                id="editMobilePhone"
                value={formData.mobilePhone}
                onChange={handleChange("mobilePhone")}
                placeholder="Enter mobile phone"
              />
            </div>

            <div className="region-form-field">
              <Label htmlFor="editLandPhone">Land Phone</Label>
              <Input
                id="editLandPhone"
                value={formData.landPhone}
                onChange={handleChange("landPhone")}
                placeholder="Enter land phone"
              />
            </div>
          </div>

          <div className="region-form-row grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="region-form-field">
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                placeholder="Enter email"
                className={errors.email ? "error" : ""}
              />
              {errors.email && <span className="region-error-text text-red-500 text-sm">{errors.email}</span>}
            </div>

            <div className="region-form-field">
              <Label htmlFor="editFax">Fax</Label>
              <Input
                id="editFax"
                value={formData.fax}
                onChange={handleChange("fax")}
                placeholder="Enter fax"
              />
            </div>
          </div>

          <div className="region-form-field">
            <Label htmlFor="editRemarks">Remarks</Label>
            <textarea
              id="editRemarks"
              value={formData.remarks}
              onChange={handleChange("remarks")}
              placeholder="Enter remarks"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="region-form-row grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="region-form-field">
              <Label htmlFor="editActive">Active Status</Label>
              <select
                id="editActive"
                value={formData.active ? "true" : "false"}
                onChange={handleChange("active")}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="region-form-field">
              <Label htmlFor="editDeleted">Deleted Status</Label>
              <select
                id="editDeleted"
                value={formData.deleted ? "true" : "false"}
                onChange={handleChange("deleted")}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="false">Not Deleted</option>
                <option value="true">Deleted</option>
              </select>
            </div>
          </div>

          <div className="region-form-row grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="region-form-field">
              <Label htmlFor="editModifiedBy">Modified By *</Label>
              <Input
                id="editModifiedBy"
                value={formData.modifiedBy}
                onChange={handleChange("modifiedBy")}
                placeholder="Enter modified by"
                className={errors.modifiedBy ? "error" : ""}
              />
              {errors.modifiedBy && <span className="region-error-text text-red-500 text-sm">{errors.modifiedBy}</span>}
            </div>
          </div>

          {error.updateRegion && (
            <div className="region-error-message text-red-500 p-2 bg-red-50 rounded-md">{error.updateRegion}</div>
          )}

          <div className="region-form-actions flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading.updateRegion}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading.updateRegion}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading.updateRegion ? "Updating..." : "Update Region"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
