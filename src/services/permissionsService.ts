import { SERVER_URL } from "@/utils/constants";

const API_BASE_URL = SERVER_URL;

export interface Permission {
  permissionID: number;
  permissionName: string;
  module: string;
  category: string;
  remarks: string;
  rolePermissions: null;
}

export interface CreatePermissionRequest {
  permissionName: string;
  module: string;
  category: string;
  remarks: string;
}

export interface CreatePermissionResponse {
  success: boolean;
  message: string;
  data: Permission;
}

class PermissionsService {
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/permissions`, {
        method: "GET",
        headers: {
          accept: "*/*",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching permissions:", error);
      throw error;
    }
  }

  async getPermissionById(id: number): Promise<Permission> {
    try {
      const response = await fetch(`${API_BASE_URL}/permissions/${id}`, {
        method: "GET",
        headers: {
          accept: "*/*",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching permission:", error);
      throw error;
    }
  }

  async createPermission(
    permissionData: CreatePermissionRequest
  ): Promise<Permission> {
    try {
      const response = await fetch(`${API_BASE_URL}/permissions`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(permissionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating permission:", error);
      throw error;
    }
  }

  async createSimplePermission(
    permissionName: string
  ): Promise<CreatePermissionResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/permissions/add?permissionName=${encodeURIComponent(
          permissionName
        )}`,
        {
          method: "POST",
          headers: {
            accept: "*/*",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating simple permission:", error);
      throw error;
    }
  }

  async updatePermission(
    id: number,
    permissionData: CreatePermissionRequest
  ): Promise<Permission> {
    try {
      const response = await fetch(`${API_BASE_URL}/permissions/${id}`, {
        method: "PUT",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(permissionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating permission:", error);
      throw error;
    }
  }

  async deletePermission(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/permissions/${id}`, {
        method: "DELETE",
        headers: {
          accept: "*/*",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting permission:", error);
      throw error;
    }
  }
}

export const permissionsService = new PermissionsService();
