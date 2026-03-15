import AdminSidebar from "../components/admin/admin.sidebar";
import { Outlet } from "react-router-dom";

const Admin = () => {
  return (
    <div className="w-full flex h-full">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:ml-52 max-md:ml-15">
      <Outlet />
      </div>
    </div>
  );
};

export default Admin;
