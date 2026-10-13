export interface User {
  userID: number;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phone: string;
  pwdExpiry?: string;
  secQuestion?: string;
  secAnswer?: string;
  active: number | boolean;
  reset?: number;
  submittedBy?: string;
  submittedOn?: string;
  modifiedBy?: string;
  modifiedOn?: string;
  userRoles?: any[] | null;  // Allow null
  userPermissions?: any[] | null; // Allow null
  roles?: any[]; // This might not come from backend
}

export interface LocalUser {
  id: number;
  username: string;
  roles: [];
  permissions: [];
}

export interface CreateUserRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface UpdateUserRequest {
  username: string;
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string; // Some backends require this
}

export interface AssignRoleRequest {
  userId: number;
  roleId: number;
}

export interface UsersResponse {
  total: number;
  items: User[];
}

export interface UserState {
  users: User[];
  totalUsers: number;
  loading: {
    getAllUsers: boolean;
    getUserById: boolean;
    createUser: boolean;
    updateUser: boolean;
    deleteUser: boolean;
    changePassword: boolean;
    assignRole: boolean;
    removeRole: boolean;
  };
  success: {
    createUser: boolean;
    updateUser: boolean;
    deleteUser: boolean;
    changePassword: boolean;
    assignRole: boolean;
    removeRole: boolean;
  };
  error: {
    getAllUsers: string | null;
    getUserById: string | null;
    createUser: string | null;
    updateUser: string | null;
    deleteUser: string | null;
    changePassword: string | null;
    assignRole: string | null;
    removeRole: string | null;
  };
}
