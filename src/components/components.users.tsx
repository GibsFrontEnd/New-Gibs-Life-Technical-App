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
  setShowCreateUserDialog,
  setShowEditUserDialog,
  setShowChangePasswordDialog,
} from "../features/reducers/uiReducers/uiSlice"
import {
  createUser,
  updateUser,
  changePassword,
  assignRole,
  removeRole,
  selectUsers,
  clearMessages,
} from "../features/reducers/adminReducers/userSlice"
import type { User, CreateUserRequest, UpdateUserRequest, ChangePasswordRequest } from "../types/user"

export const CreateUser = () => {
  const dispatch = useAppDispatch()
  const { showCreateUserDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectUsers)

  const [formData, setFormData] = useState<CreateUserRequest>({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    address: "",
    email: "",
    phone: "",
    active: true,
  })

  const [errors, setErrors] = useState<Partial<CreateUserRequest>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Partial<CreateUserRequest> = {}
    if (!formData.username.trim()) newErrors.username = "Username is required"
    if (!formData.password.trim()) newErrors.password = "Password is required"
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(createUser(formData))
  }

  const handleClose = () => {
    setFormData({
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      address: "",
      email: "",
      phone: "",
      active: true,
    })
    setErrors({})
    dispatch(setShowCreateUserDialog(false))
  }

  const handleChange = (field: keyof CreateUserRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === "active" ? e.target.checked : e.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  useEffect(() => {
    if (success.createUser) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.createUser, dispatch])

  return (
    <Dialog open={showCreateUserDialog} onOpenChange={handleClose}>
      <DialogContent className="su-create-user-dialog">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="su-user-form">
          <div className="su-form-row">
            <div className="su-form-field">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={handleChange("username")}
                placeholder="Enter username"
                className={errors.username ? "su-error" : ""}
              />
              {errors.username && <span className="su-error-text">{errors.username}</span>}
            </div>

            <div className="su-form-field">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange("password")}
                placeholder="Enter password"
                className={errors.password ? "su-error" : ""}
              />
              {errors.password && <span className="su-error-text">{errors.password}</span>}
            </div>
          </div>

          <div className="su-form-row">
            <div className="su-form-field">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                placeholder="Enter first name"
                className={errors.firstName ? "su-error" : ""}
              />
              {errors.firstName && <span className="su-error-text">{errors.firstName}</span>}
            </div>

            <div className="su-form-field">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                placeholder="Enter last name"
                className={errors.lastName ? "su-error" : ""}
              />
              {errors.lastName && <span className="su-error-text">{errors.lastName}</span>}
            </div>
          </div>

          <div className="su-form-field">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              placeholder="Enter email address"
              className={errors.email ? "su-error" : ""}
            />
            {errors.email && <span className="su-error-text">{errors.email}</span>}
          </div>

          <div className="su-form-row">
            <div className="su-form-field">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handleChange("phone")}
                placeholder="Enter phone number"
              />
            </div>

            <div className="su-form-field">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={handleChange("address")}
                placeholder="Enter address"
              />
            </div>
          </div>

          <div className="su-form-field su-checkbox-field">
            <label className="su-checkbox-label">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={handleChange("active")}
                className="su-checkbox-input"
              />
              <span className="su-checkbox-text">Active User</span>
            </label>
          </div>

          {error.createUser && <div className="su-error-message">{error.createUser}</div>}

          <div className="su-form-actions">
            <Button 
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button 
              className="su-submit-btn"
            >
              {loading.createUser ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const EditUser = ({ user }: { user: User | null }) => {
  const dispatch = useAppDispatch()
  const { showEditUserDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectUsers)

  const [formData, setFormData] = useState<UpdateUserRequest>({
    username: "",
    firstName: "",
    lastName: "",
    address: "",
    email: "",
    phone: "",
    active: true,
  })

  const [errors, setErrors] = useState<Partial<UpdateUserRequest>>({})

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        address: user.address || "",
        email: user.email || "",
        phone: user.phone || "",
        active: user.active === 1 || user.active === true,
      })
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const newErrors: Partial<UpdateUserRequest> = {}
    if (!formData.username.trim()) newErrors.username = "Username is required"
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(updateUser({ id: user.userID, userData: formData }))
  }

  const handleClose = () => {
    setFormData({
      username: "",
      firstName: "",
      lastName: "",
      address: "",
      email: "",
      phone: "",
      active: true,
    })
    setErrors({})
    dispatch(setShowEditUserDialog(false))
  }

  const handleChange = (field: keyof UpdateUserRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === "active" ? e.target.checked : e.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // Handle success state
  useEffect(() => {
    if (success.updateUser) {
      // We'll handle success with toast in the parent component
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.updateUser, dispatch])

  // Handle errors
  useEffect(() => {
    if (error.updateUser) {
      // Error will be displayed in the form
      console.error("Update user error:", error.updateUser)
    }
  }, [error.updateUser])

  return (
    <>
      <Dialog open={showEditUserDialog} onOpenChange={handleClose}>
        <DialogContent className="su-edit-user-dialog">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            {user && (
              <div className="su-user-id-display">
                User ID: <span className="su-user-id-value">{user.userID}</span>
              </div>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="su-user-form">
            <div className="su-form-row">
              <div className="su-form-field">
                <Label htmlFor="editUsername">Username *</Label>
                <Input
                  id="editUsername"
                  value={formData.username}
                  onChange={handleChange("username")}
                  placeholder="Enter username"
                  className={errors.username ? "su-error" : ""}
                />
                {errors.username && <span className="su-error-text">{errors.username}</span>}
              </div>
            </div>

            <div className="su-form-row">
              <div className="su-form-field">
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={handleChange("firstName")}
                  placeholder="Enter first name"
                  className={errors.firstName ? "su-error" : ""}
                />
                {errors.firstName && <span className="su-error-text">{errors.firstName}</span>}
              </div>

              <div className="su-form-field">
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={handleChange("lastName")}
                  placeholder="Enter last name"
                  className={errors.lastName ? "su-error" : ""}
                />
                {errors.lastName && <span className="su-error-text">{errors.lastName}</span>}
              </div>
            </div>

            <div className="su-form-field">
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                placeholder="Enter email address"
                className={errors.email ? "su-error" : ""}
              />
              {errors.email && <span className="su-error-text">{errors.email}</span>}
            </div>

            <div className="su-form-row">
              <div className="su-form-field">
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={formData.phone}
                  onChange={handleChange("phone")}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="su-form-field">
                <Label htmlFor="editAddress">Address</Label>
                <Input
                  id="editAddress"
                  value={formData.address}
                  onChange={handleChange("address")}
                  placeholder="Enter address"
                />
              </div>
            </div>

            <div className="su-form-field su-checkbox-field">
              <label className="su-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={handleChange("active")}
                  className="su-checkbox-input"
                />
                <span className="su-checkbox-text">Active User</span>
              </label>
            </div>

            {error.updateUser && <div className="su-error-message">{error.updateUser}</div>}

            <div className="su-form-actions">
              <Button 
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button 
                className="su-submit-btn"
              >
                {loading.updateUser ? "Updating..." : "Update User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export const ChangePassword = ({ user }: { user: User | null }) => {
  const dispatch = useAppDispatch()
  const { showChangePasswordDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectUsers)

  const [formData, setFormData] = useState<ChangePasswordRequest>({
    currentPassword: "",
    newPassword: "",
  })

  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Partial<ChangePasswordRequest & { confirmPassword: string }>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const newErrors: Partial<ChangePasswordRequest & { confirmPassword: string }> = {}
    if (!formData.currentPassword.trim()) newErrors.currentPassword = "Current password is required"
    if (!formData.newPassword.trim()) newErrors.newPassword = "New password is required"
    if (formData.newPassword !== confirmPassword) newErrors.confirmPassword = "Passwords do not match"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(changePassword({ userId: user.userID, passwordData: formData }))
  }

  const handleClose = () => {
    setFormData({ currentPassword: "", newPassword: "" })
    setConfirmPassword("")
    setErrors({})
    dispatch(setShowChangePasswordDialog(false))
  }

  const handleChange = (field: keyof ChangePasswordRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
  }

  useEffect(() => {
    if (success.changePassword) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.changePassword, dispatch])

  return (
    <Dialog open={showChangePasswordDialog} onOpenChange={handleClose}>
      <DialogContent className="su-change-password-dialog">
        <DialogHeader>
          <DialogTitle>Change Password - {user?.username}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="su-password-form">
          <div className="su-form-field">
            <Label htmlFor="currentPassword">Current Password *</Label>
            <Input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange("currentPassword")}
              placeholder="Enter current password"
              className={errors.currentPassword ? "su-error" : ""}
            />
            {errors.currentPassword && <span className="su-error-text">{errors.currentPassword}</span>}
          </div>

          <div className="su-form-field">
            <Label htmlFor="newPassword">New Password *</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange("newPassword")}
              placeholder="Enter new password"
              className={errors.newPassword ? "su-error" : ""}
            />
            {errors.newPassword && <span className="su-error-text">{errors.newPassword}</span>}
          </div>

          <div className="su-form-field">
            <Label htmlFor="confirmPassword">Confirm New Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirm new password"
              className={errors.confirmPassword ? "su-error" : ""}
            />
            {errors.confirmPassword && <span className="su-error-text">{errors.confirmPassword}</span>}
          </div>

          {error.changePassword && <div className="su-error-message">{error.changePassword}</div>}

          <div className="su-form-actions">
            <Button 
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button 
              className="su-submit-btn"
            >
              {loading.changePassword ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const AssignRole = ({
  user,
  roles,
  isOpen,
  onClose,
}: {
  user: User | null
  roles: any[]
  isOpen: boolean
  onClose: () => void
}) => {
  const dispatch = useAppDispatch()
  const { loading, success, error } = useAppSelector(selectUsers)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<any>(null)

  const filteredRoles = roles.filter(
    (role) =>
      role.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.roleDescription?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAssignRole = () => {
    if (!user || !selectedRole) return

    dispatch(
      assignRole({
        userId: user.userID,
        roleId: selectedRole.roleID,
      }),
    )
  }

  const handleClose = () => {
    setSearchTerm("")
    setSelectedRole(null)
    onClose()
  }

  useEffect(() => {
    if (success.assignRole) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.assignRole, dispatch])

  // Get user's current roles to avoid duplicates
  const userRoleIds = user?.roles?.map((role) => role.roleID || role.roleId || role.id) || []

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="su-assign-role-dialog">
        <DialogHeader>
          <DialogTitle>Assign Role to {user?.username}</DialogTitle>
        </DialogHeader>

        <div className="su-role-form">
          {user?.roles && user.roles.length > 0 && (
            <div className="su-current-roles">
              <div className="su-current-roles-title">Current Roles:</div>
              <div className="su-current-roles-list">
                {user.roles.map((role, index) => (
                  <span key={index} className="su-current-role-badge">
                    {role.roleName || role.name || `Role ${role.roleId || role.id}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="su-form-field">
            <Label htmlFor="roleSearch">Search Roles</Label>
            <Input
              id="roleSearch"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by role name or description..."
              className="su-role-search"
            />
          </div>

          <div className="su-form-field">
            <Label>Available Roles</Label>
            <div className="su-role-list">
              {filteredRoles.length === 0 ? (
                <div className="su-role-item">
                  <span>No roles found</span>
                </div>
              ) : (
                filteredRoles
                  .filter((role) => !userRoleIds.includes(role.roleID))
                  .map((role) => (
                    <div key={role.roleID} className="su-role-item">
                      <div className="su-role-info">
                        <div className="su-role-name">{role.roleName}</div>
                        {role.roleDescription && <div className="su-role-description">{role.roleDescription}</div>}
                      </div>
                      <Button
                        className="su-role-select-btn"
                        onClick={() => setSelectedRole(role)}
                      >
                        {selectedRole?.roleID === role.roleID ? "Selected" : "Select"}
                      </Button>
                    </div>
                  ))
              )}
            </div>
          </div>

          {selectedRole && (
            <div className="su-form-field"> <br />
              <Label>Selected Role</Label>
              <div className="su-role-item" style={{ border: "2px solid #dc2626", borderRadius: "6px" }}>
                <div className="su-role-info">
                  <div className="su-role-name">{selectedRole.roleName}</div>
                  {selectedRole.roleDescription && (
                    <div className="su-role-description">{selectedRole.roleDescription}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error.assignRole && <div className="su-error-message">{error.assignRole}</div>}

          <div className="su-form-actions">
            <Button 
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignRole}
              // disabled={!selectedRole}
              className="su-submit-btn"
            >
              {loading.assignRole ? "Assigning..." : "Assign Role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const RemoveRole = ({
  user,
  // roles,
  isOpen,
  onClose,
}: {
  user: User | null
  roles: any[]
  isOpen: boolean
  onClose: () => void
}) => {
  const dispatch = useAppDispatch()
  const { loading, success, error } = useAppSelector(selectUsers)

  const [selectedRole, setSelectedRole] = useState<any>(null)

  const handleRemoveRole = () => {
    if (!user || !selectedRole) return

    dispatch(
      removeRole({
        userId: user.userID,
        roleId: selectedRole.roleID || selectedRole.roleId || selectedRole.id,
      }),
    )
  }

  const handleClose = () => {
    setSelectedRole(null)
    onClose()
  }

  useEffect(() => {
    if (success.removeRole) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.removeRole, dispatch])

  // Get user's current roles
  const userRoles = user?.roles || []

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="su-remove-role-dialog">
        <DialogHeader>
          <DialogTitle>Remove Role from {user?.username}</DialogTitle>
        </DialogHeader>

        <div className="su-role-form">
          {userRoles.length === 0 ? (
            <div className="su-form-field">
              <p>This user has no roles assigned.</p>
            </div>
          ) : (
            <>
              <div className="su-form-field">
                <Label>Current Roles</Label>
                <div className="su-role-list">
                  {userRoles.map((role, index) => (
                    <div key={role.roleID || role.roleId || role.id || index} className="su-role-item">
                      <div className="su-role-info">
                        <div className="su-role-name">
                          {role.roleName || role.name || `Role ${role.roleId || role.id}`}
                        </div>
                        {role.roleDescription && <div className="su-role-description">{role.roleDescription}</div>}
                      </div>
                      <Button 
                        className="su-role-select-btn"
                        onClick={() => setSelectedRole(role)}
                        style={{
                          background:
                            selectedRole?.roleID === (role.roleID || role.roleId || role.id) ? "#b91c1c" : "#dc2626",
                        }}
                      >
                        {selectedRole?.roleID === (role.roleID || role.roleId || role.id) ? "Selected" : "Remove"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRole && (
                <div className="su-form-field">
                  <Label>Role to Remove</Label>
                  <div className="su-role-item" style={{ border: "2px solid #dc2626", borderRadius: "6px" }}>
                    <div className="su-role-info">
                      <div className="su-role-name">
                        {selectedRole.roleName || selectedRole.name || `Role ${selectedRole.roleId || selectedRole.id}`}
                      </div>
                      {selectedRole.roleDescription && (
                        <div className="su-role-description">{selectedRole.roleDescription}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {error.removeRole && <div className="su-error-message">{error.removeRole}</div>}

          <div className="su-form-actions">
            <Button 
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRemoveRole}
              // disabled={!selectedRole || userRoles.length === 0}
              className="su-submit-btn"
              style={{ background: "#dc2626" }}
            >
              {loading.removeRole ? "Removing..." : "Remove Role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}