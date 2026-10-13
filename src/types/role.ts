export interface Role {
  roleID: number;
  roleName: string;
  roleDescription: string;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string;
  modifiedOn: string;
  userRoles: unknown;
  rolePermissions: unknown;
}

export interface RoleDetails {
  roleID: number;
  roleName: string;
  roleDescription: string;
  permissions: RolePermissions[] | null;
}

interface RolePermissions {
  permissionID: number;
  permissionName: string;
}

export interface RoleCreateUpdateRequest {
  roleName: string;
  roleDescription: string;
}

export interface RoleState {
  roles: Role[];
  role: RoleDetails | null;
  loading: {
    getAllRoles: boolean;
    getRoleDetails: boolean;
    createRole: boolean;
    updateRole: boolean;
    deleteRole: boolean;
    assignPermission: boolean;
    removePermission: boolean;
  };
  error: {
    getAllRoles: unknown;
    getRoleDetails: unknown;
    createRole: unknown;
    updateRole: unknown;
    deleteRole: unknown;
    assignPermission: unknown;
    removePermission: unknown;
  };
  success: {
    createRole: boolean;
    updateRole: boolean;
    deleteRole: boolean;
    assignPermission: boolean;
    removePermission: boolean;
  };
}
