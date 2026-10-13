"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "../hooks/use-apps"
import { Button } from "./UI/new-button"
import Input from "./UI/Input"
import { Label } from "./UI/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./UI/dialog"
import { selectUiState, setShowCreateRiskDialog, setShowEditRiskDialog } from "../features/reducers/uiReducers/uiSlice"
import { createRisk, updateRisk, selectRisks, clearMessages } from "../features/reducers/adminReducers/riskSlice"
import type { Risk, CreateRiskRequest, UpdateRiskRequest } from "../types/risk"
import "@/components/admin/product-page/ProductsRisks.css"
export const CreateRisk = () => {
  const dispatch = useAppDispatch()
  const { showCreateRiskDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectRisks)

  const [formData, setFormData] = useState<CreateRiskRequest>({
    riskID: "",
    riskName: "",
    description: "",
  })

  const [errors, setErrors] = useState<Partial<CreateRiskRequest>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Partial<CreateRiskRequest> = {}
    if (!formData.riskID.trim()) {
      newErrors.riskID = "Risk ID is required"
    }
    if (!formData.riskName.trim()) {
      newErrors.riskName = "Risk name is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(createRisk(formData))
  }

  const handleClose = () => {
    setFormData({
      riskID: "",
      riskName: "",
      description: "",
    })
    setErrors({})
    dispatch(setShowCreateRiskDialog(false))
  }

  const handleChange =
    (field: keyof CreateRiskRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    if (success.createRisk) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success?.createRisk, dispatch])

  return (
    <Dialog open={showCreateRiskDialog} onOpenChange={handleClose}>
      <DialogContent className="pr-create-risk-dialog">
        <DialogHeader>
          <DialogTitle>Create New Risk</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="pr-risk-form">
          <div className="pr-form-field">
            <Label htmlFor="riskID">Risk ID *</Label>
            <Input
              id="riskID"
              value={formData.riskID}
              onChange={handleChange("riskID")}
              placeholder="Enter risk ID (e.g., F, G, MH)"
              className={errors.riskID ? "pr-error" : ""}
            />
            {errors.riskID && <span className="pr-error-text">{errors.riskID}</span>}
          </div>

          <div className="pr-form-field">
            <Label htmlFor="riskName">Risk Name *</Label>
            <Input
              id="riskName"
              value={formData.riskName}
              onChange={handleChange("riskName")}
              placeholder="Enter risk name"
              className={errors.riskName ? "pr-error" : ""}
            />
            {errors.riskName && <span className="pr-error-text">{errors.riskName}</span>}
          </div>

          <div className="pr-form-field">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={handleChange("description")}
              placeholder="Enter description (optional)"
              className="pr-form-field pr-textarea"
            />
          </div>

          {error.createRisk && <div className="pr-error-message">{error.createRisk}</div>}

          <div className="pr-form-actions"> 
            <Button    //@ts-ignore
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={loading.createRisk}
            >
              Cancel
            </Button>
            <Button   //@ts-ignore
              type="submit" 
              disabled={loading.createRisk} 
              className="pr-submit-btn"
            >
              {loading.createRisk ? "Creating..." : "Create Risk"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const EditRisk = ({ risk }: { risk: Risk | null }) => {
  const dispatch = useAppDispatch()
  const { showEditRiskDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectRisks)

  const [formData, setFormData] = useState<UpdateRiskRequest>({
    riskName: "",
    description: "",
  })

  const [errors, setErrors] = useState<Partial<UpdateRiskRequest>>({})

  useEffect(() => {
    if (risk) {
      setFormData({
        riskName: risk.riskName || "",
        description: risk.description || "",
      })
    }
  }, [risk])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!risk) return

    const newErrors: Partial<UpdateRiskRequest> = {}
    if (!formData.riskName.trim()) {
      newErrors.riskName = "Risk name is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(updateRisk({ id: risk.riskID, riskData: formData }))
  }

  const handleClose = () => {
    setFormData({
      riskName: "",
      description: "",
    })
    setErrors({})
    dispatch(setShowEditRiskDialog(false))
  }

  const handleChange =
    (field: keyof UpdateRiskRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    if (success.updateRisk) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success?.updateRisk, dispatch])

  return (
    <Dialog open={showEditRiskDialog} onOpenChange={handleClose}>
      <DialogContent className="pr-edit-risk-dialog">
        <DialogHeader>
          <DialogTitle>Edit Risk - {risk?.riskID}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="pr-risk-form">
          <div className="pr-form-field">
            <Label htmlFor="editRiskName">Risk Name *</Label>
            <Input
              id="editRiskName"
              value={formData.riskName}
              onChange={handleChange("riskName")}
              placeholder="Enter risk name"
              className={errors.riskName ? "pr-error" : ""}
            />
            {errors.riskName && <span className="pr-error-text">{errors.riskName}</span>}
          </div>

          <div className="pr-form-field">
            <Label htmlFor="editDescription">Description</Label>
            <textarea
              id="editDescription"
              value={formData.description}
              onChange={handleChange("description")}
              placeholder="Enter description (optional)"
              className="pr-form-field pr-textarea"
            />
          </div>

          {error.updateRisk && <div className="pr-error-message">{error.updateRisk}</div>}

          <div className="pr-form-actions">
            <Button   //@ts-ignore
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={loading.updateRisk}
            >
              Cancel
            </Button>
            <Button   //@ts-ignore
              type="submit" 
              disabled={loading.updateRisk} 
              className="pr-submit-btn"
            >
              {loading.updateRisk ? "Updating..." : "Update Risk"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
