export interface Permission {
  permissionID: number
  permissionName: string
  module: string
  category: string
  remarks: string
  rolePermissions: null
}

export interface CreatePermissionRequest {
  permissionName: string
  module: string
  category: string
  remarks: string
}

export interface PermissionState {
  permissions: Permission[]
  loading: {
    getAllPermissions: boolean
    createPermission: boolean
    updatePermission: boolean
    deletePermission: boolean
  }
  success: {
    createPermission: boolean
    updatePermission: boolean
    deletePermission: boolean
  }
  error: {
    getAllPermissions: string | null
    createPermission: string | null
    updatePermission: string | null
    deletePermission: string | null
  }
}
