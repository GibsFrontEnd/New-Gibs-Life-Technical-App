"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "../hooks/use-apps"
import { Button } from "./UI/new-button"
import Input  from "./UI/Input"
import { Label } from "./UI/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./UI/dialog"
import {
  selectUiState,
  setShowCreatePermissionDialog,
  setShowEditPermissionDialog,
} from "../features/reducers/uiReducers/uiSlice"
import {
  createPermission,
  updatePermission,
  selectPermissions,
  clearMessages,
} from "../features/reducers/adminReducers/permissionSlice"
import type { Permission, CreatePermissionRequest } from "../types/permission"

export const CreatePermission = () => {
  const dispatch = useAppDispatch()
  const { showCreatePermissionDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectPermissions)

  const [formData, setFormData] = useState<CreatePermissionRequest>({
    permissionName: "",
    module: "",
    category: "",
    remarks: "",
  })

  const [errors, setErrors] = useState<Partial<CreatePermissionRequest>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const newErrors: Partial<CreatePermissionRequest> = {}
    if (!formData.permissionName.trim()) {
      newErrors.permissionName = "Permission name is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(createPermission(formData))
  }

  const handleClose = () => {
    setFormData({
      permissionName: "",
      module: "",
      category: "",
      remarks: "",
    })
    setErrors({})
    dispatch(setShowCreatePermissionDialog(false))
  }

  const handleChange = (field: keyof CreatePermissionRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  useEffect(() => {
    if (success.createPermission) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.createPermission, dispatch])

  

  return (
    <Dialog open={showCreatePermissionDialog} onOpenChange={handleClose}>
      <DialogContent className="sp-create-permission-dialog">
        <DialogHeader>
          <DialogTitle>Create New Permission</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="sp-permission-form">
          <div className="sp-form-field">
            <Label htmlFor="permissionName">Permission Name *</Label>
            <Input
              id="permissionName"
              value={formData.permissionName}
              onChange={handleChange("permissionName")}
              placeholder="Enter permission name"
              className={errors.permissionName ? "error" : ""}
            />
            {errors.permissionName && <span className="sp-error-text">{errors.permissionName}</span>}
          </div>

          <div className="sp-form-field">
            <Label htmlFor="module">Module</Label>
            <Input
              id="module"
              value={formData.module}
              onChange={handleChange("module")}
              placeholder="Enter module name"
            />
          </div>

          <div className="sp-form-field">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={handleChange("category")}
              placeholder="Enter category"
            />
          </div>

          <div className="sp-form-field">
            <Label htmlFor="remarks">Remarks</Label>
            <Input
              id="remarks"
              value={formData.remarks}
              onChange={handleChange("remarks")}
              placeholder="Enter remarks"
            />
          </div>

          {error.createPermission && <div className="sp-error-message">{error.createPermission}</div>}

          <div className="sp-form-actions">
            <Button // @ts-ignore
            type="button" variant="outline" onClick={handleClose} disabled={loading.createPermission}>
              Cancel
            </Button>
            <Button // @ts-ignore
             type="submit" disabled={loading.createPermission} className="sp-submit-btn">
              {loading.createPermission ? "Creating..." : "Create Permission"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const EditPermission = ({ permission }: { permission: Permission | null }) => {
  const dispatch = useAppDispatch()
  const { showEditPermissionDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectPermissions)

  const [formData, setFormData] = useState<CreatePermissionRequest>({
    permissionName: "",
    module: "",
    category: "",
    remarks: "",
  })

  const [errors, setErrors] = useState<Partial<CreatePermissionRequest>>({})

  useEffect(() => {
    if (permission) {
      setFormData({
        permissionName: permission.permissionName || "",
        module: permission.module || "",
        category: permission.category || "",
        remarks: permission.remarks || "",
      })
    }
  }, [permission])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!permission) return

    // Validation
    const newErrors: Partial<CreatePermissionRequest> = {}
    if (!formData.permissionName.trim()) {
      newErrors.permissionName = "Permission name is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(updatePermission({ id: permission.permissionID, permissionData: formData }))
  }

  const handleClose = () => {
    setFormData({
      permissionName: "",
      module: "",
      category: "",
      remarks: "",
    })
    setErrors({})
    dispatch(setShowEditPermissionDialog(false))
  }

  const handleChange = (field: keyof CreatePermissionRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  useEffect(() => {
    if (success.updatePermission) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.updatePermission, dispatch])

  return (
    <Dialog open={showEditPermissionDialog} onOpenChange={handleClose}>
      <DialogContent className="sp-edit-permission-dialog">
        <DialogHeader>
          <DialogTitle>Edit Permission</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="sp-permission-form">
          <div className="sp-form-field">
            <Label htmlFor="editPermissionName">Permission Name *</Label>
            <Input
              id="editPermissionName"
              value={formData.permissionName}
              onChange={handleChange("permissionName")}
              placeholder="Enter permission name"
              className={errors.permissionName ? "error" : ""}
            />
            {errors.permissionName && <span className="sp-error-text">{errors.permissionName}</span>}
          </div>

          <div className="sp-form-field">
            <Label htmlFor="editModule">Module</Label>
            <Input
              id="editModule"
              value={formData.module}
              onChange={handleChange("module")}
              placeholder="Enter module name"
            />
          </div>

          <div className="sp-form-field">
            <Label htmlFor="editCategory">Category</Label>
            <Input
              id="editCategory"
              value={formData.category}
              onChange={handleChange("category")}
              placeholder="Enter category"
            />
          </div>

          <div className="sp-form-field">
            <Label htmlFor="editRemarks">Remarks</Label>
            <Input
              id="editRemarks"
              value={formData.remarks}
              onChange={handleChange("remarks")}
              placeholder="Enter remarks"
            />
          </div>

          {error.updatePermission && <div className="sp-error-message">{error.updatePermission}</div>}

          <div className="sp-form-actions">
            <Button // @ts-ignore
            type="button" variant="outline" onClick={handleClose} disabled={loading.updatePermission}>
              Cancel
            </Button>
            <Button // @ts-ignore
            type="submit" disabled={loading.updatePermission} className="sp-submit-btn">
              {loading.updatePermission ? "Updating..." : "Update Permission"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
