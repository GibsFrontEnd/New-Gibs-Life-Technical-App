"use client"

import type React from "react"
import { useState } from "react"
import Modal from "../UI/Modal"
import Button from "../UI/Button"
import Input from "../UI/Input"
import FormField from "../UI/FormField"
import type { CreatePermissionRequest } from "../../services/permissionsService"

interface CreatePermissionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreatePermissionRequest) => void
  loading?: boolean
}

const CreatePermissionModal: React.FC<CreatePermissionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreatePermissionRequest>({
    permissionName: "",
    module: "",
    category: "",
    remarks: "",
  })

  const [errors, setErrors] = useState<Partial<CreatePermissionRequest>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    const newErrors: Partial<CreatePermissionRequest> = {}
    if (!formData.permissionName.trim()) {
      newErrors.permissionName = "Permission name is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit(formData)
    handleClose()
  }

  const handleClose = () => {
    setFormData({
      permissionName: "",
      module: "",
      category: "",
      remarks: "",
    })
    setErrors({})
    onClose()
  }

  const handleChange = (field: keyof CreatePermissionRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Permission">
      <form onSubmit={handleSubmit}>
        <FormField label="Permission Name" required error={errors.permissionName}>
          <Input
            value={formData.permissionName}
            onChange={handleChange("permissionName")}
            placeholder="Enter permission name"
            required
          />
        </FormField>

        <FormField label="Module">
          <Input value={formData.module} onChange={handleChange("module")} placeholder="Enter module name" />
        </FormField>

        <FormField label="Category">
          <Input value={formData.category} onChange={handleChange("category")} placeholder="Enter category" />
        </FormField>

        <FormField label="Remarks">
          <Input value={formData.remarks} onChange={handleChange("remarks")} placeholder="Enter remarks" />
        </FormField>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "📄 Create Permission"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreatePermissionModal
