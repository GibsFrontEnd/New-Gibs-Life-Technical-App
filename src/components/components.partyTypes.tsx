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
  setShowCreatePartyTypeDialog,
  setShowEditPartyTypeDialog,
} from "../features/reducers/uiReducers/uiSlice"
import {
  createPartyType,
  updatePartyType,
  selectPartyTypes,
  clearMessages,
} from "../features/reducers/adminReducers/partyTypeSlice"
import type { PartyType, CreatePartyTypeRequest, UpdatePartyTypeRequest } from "../types/partyType"
import "./components.partyTypes.css"

export const CreatePartyType = () => {
  const dispatch = useAppDispatch()
  const { showCreatePartyTypeDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectPartyTypes)

  const [formData, setFormData] = useState<CreatePartyTypeRequest>({
    code: "",
    name: "",
    groupID: 0,
    groupName: "",
    tag: "",
  })

  const [errors, setErrors] = useState<Partial<CreatePartyTypeRequest>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Partial<CreatePartyTypeRequest> = {}
    if (!formData.code.trim()) newErrors.code = "Code is required"
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.groupID || formData.groupID <= 0) newErrors.groupID = "Group ID is required"
    if (!formData.groupName.trim()) newErrors.groupName = "Group name is required"
    if (!formData.tag.trim()) newErrors.tag = "Tag is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(createPartyType(formData))
  }

  const handleClose = () => {
    setFormData({
      code: "",
      name: "",
      groupID: 0,
      groupName: "",
      tag: "",
    })
    setErrors({})
    dispatch(setShowCreatePartyTypeDialog(false))
  }

  const handleChange =
    (field: keyof CreatePartyTypeRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = field === "groupID" ? Number.parseInt(e.target.value) || 0 : e.target.value
      setFormData((prev) => ({ ...prev, [field]: value }))

      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    }

  useEffect(() => {
    if (success.createPartyType) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.createPartyType, dispatch])

  return (
    <Dialog open={showCreatePartyTypeDialog} onOpenChange={handleClose}>
      <DialogContent className="spt-create-party-type-dialog">
        <DialogHeader>
          <DialogTitle>Create New Party Type</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="spt-party-type-form">
          <div className="spt-form-row">
            <div className="spt-form-field">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={handleChange("code")}
                placeholder="Enter code (e.g., 001)"
                className={errors.code ? "spt-error" : ""}
              />
              {errors.code && <span className="spt-error-text">{errors.code}</span>}
            </div>

            <div className="spt-form-field">
              <Label htmlFor="tag">Tag *</Label>
              <select
                id="tag"
                value={formData.tag}
                onChange={handleChange("tag")}
                className={`spt-select ${errors.tag ? "spt-error" : ""}`}
              >
                <option value="">Select tag</option>
                <option value="A">A - Agent</option>
                <option value="B">B - Business</option>
                <option value="C">C - Client</option>
              </select>
              {errors.tag && <span className="spt-error-text">{errors.tag}</span>}
            </div>
          </div>

          <div className="spt-form-field">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange("name")}
              placeholder="Enter party type name"
              className={errors.name ? "spt-error" : ""}
            />
            {errors.name && <span className="spt-error-text">{errors.name}</span>}
          </div>

          <div className="spt-form-row">
            <div className="spt-form-field">
              <Label htmlFor="groupID">Group ID *</Label>
              <Input
                id="groupID"
                type="number"
                value={formData.groupID || ""}
                onChange={handleChange("groupID")}
                placeholder="Enter group ID"
                className={errors.groupID ? "spt-error" : ""}
              />
              {errors.groupID && <span className="spt-error-text">{errors.groupID}</span>}
            </div>

            <div className="spt-form-field">
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                value={formData.groupName}
                onChange={handleChange("groupName")}
                placeholder="Enter group name"
                className={errors.groupName ? "spt-error" : ""}
              />
              {errors.groupName && <span className="spt-error-text">{errors.groupName}</span>}
            </div>
          </div>

          {error.createPartyType && <div className="spt-error-message">{error.createPartyType}</div>}

          <div className="spt-form-actions">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading.createPartyType}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading.createPartyType} className="spt-submit-btn">
              {loading.createPartyType ? "Creating..." : "Create Party Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const EditPartyType = ({ partyType }: { partyType: PartyType | null }) => {
  const dispatch = useAppDispatch()
  const { showEditPartyTypeDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectPartyTypes)

  const [formData, setFormData] = useState<UpdatePartyTypeRequest>({
    name: "",
    groupID: 0,
    groupName: "",
    tag: "",
  })

  const [errors, setErrors] = useState<Partial<UpdatePartyTypeRequest>>({})

  useEffect(() => {
    if (partyType) {
      setFormData({
        name: partyType.name || "",
        groupID: Number.parseInt(partyType.groupID) || 0,
        groupName: partyType.groupName || "",
        tag: partyType.tag || "",
      })
    }
  }, [partyType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!partyType) return

    const newErrors: Partial<UpdatePartyTypeRequest> = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.groupID || formData.groupID <= 0) newErrors.groupID = "Group ID is required"
    if (!formData.groupName.trim()) newErrors.groupName = "Group name is required"
    if (!formData.tag.trim()) newErrors.tag = "Tag is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(updatePartyType({ typeID: partyType.typeID, data: formData }))
  }

  const handleClose = () => {
    setFormData({
      name: "",
      groupID: 0,
      groupName: "",
      tag: "",
    })
    setErrors({})
    dispatch(setShowEditPartyTypeDialog(false))
  }

  const handleChange =
    (field: keyof UpdatePartyTypeRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = field === "groupID" ? Number.parseInt(e.target.value) || 0 : e.target.value
      setFormData((prev) => ({ ...prev, [field]: value }))

      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

  useEffect(() => {
    if (success.updatePartyType) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.updatePartyType, dispatch])

  return (
    <Dialog open={showEditPartyTypeDialog} onOpenChange={handleClose}>
      <DialogContent className="spt-edit-party-type-dialog">
        <DialogHeader>
          <DialogTitle>Edit Party Type - {partyType?.typeID}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="spt-party-type-form">
          <div className="spt-form-field spt-readonly-field">
            <Label htmlFor="editTypeID">Type ID</Label>
            <Input id="editTypeID" value={partyType?.typeID || ""} disabled className="spt-readonly-input" />
            <span className="spt-readonly-note">Type ID cannot be changed</span>
          </div>

          <div className="spt-form-field spt-readonly-field">
            <Label htmlFor="editCode">Code</Label>
            <Input id="editCode" value={partyType?.code || ""} disabled className="spt-readonly-input" />
            <span className="spt-readonly-note">Code cannot be changed</span>
          </div>

          <div className="spt-form-field">
            <Label htmlFor="editName">Name *</Label>
            <Input
              id="editName"
              value={formData.name}
              onChange={handleChange("name")}
              placeholder="Enter party type name"
              className={errors.name ? "spt-error" : ""}
            />
            {errors.name && <span className="spt-error-text">{errors.name}</span>}
          </div>

          <div className="spt-form-row">
            <div className="spt-form-field">
              <Label htmlFor="editGroupID">Group ID *</Label>
              <Input
                id="editGroupID"
                type="number"
                value={formData.groupID || ""}
                onChange={handleChange("groupID")}
                placeholder="Enter group ID"
                className={errors.groupID ? "spt-error" : ""}
              />
              {errors.groupID && <span className="spt-error-text">{errors.groupID}</span>}
            </div>

            <div className="spt-form-field">
              <Label htmlFor="editGroupName">Group Name *</Label>
              <Input
                id="editGroupName"
                value={formData.groupName}
                onChange={handleChange("groupName")}
                placeholder="Enter group name"
                className={errors.groupName ? "spt-error" : ""}
              />
              {errors.groupName && <span className="spt-error-text">{errors.groupName}</span>}
            </div>
          </div>

          <div className="spt-form-field">
            <Label htmlFor="editTag">Tag *</Label>
            <select
              id="editTag"
              value={formData.tag}
              onChange={handleChange("tag")}
              className={`spt-select ${errors.tag ? "spt-error" : ""}`}
            >
              <option value="">Select tag</option>
              <option value="A">A - Agent</option>
              <option value="B">B - Business</option>
              <option value="C">C - Client</option>
            </select>
            {errors.tag && <span className="spt-error-text">{errors.tag}</span>}
          </div>

          {error.updatePartyType && <div className="spt-error-message">{error.updatePartyType}</div>}

          <div className="spt-form-actions">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading.updatePartyType}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading.updatePartyType} className="spt-submit-btn">
              {loading.updatePartyType ? "Updating..." : "Update Party Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
