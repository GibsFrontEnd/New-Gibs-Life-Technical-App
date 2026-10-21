//@ts-nocheck
import { Outlet } from "react-router-dom";

const Reports = () => (
  <div className="w-full flex h-full">
    <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
      <Outlet />
    </div>
  </div>
);

export default Reports;
