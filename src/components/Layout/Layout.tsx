import React from "react";
import { useSelector } from "react-redux";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import CustomerLayout from "../../pages/customer/CustomerLayout";

// Add getUserRole function
const getUserRole = (user: any) => {
  // First try from localStorage
  const storedRole = localStorage.getItem("userRole");
  if (storedRole) {
    return storedRole.toLowerCase();
  }
  
  if (user) {
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles[0]?.toLowerCase() || 'agent';
    }
    if (user.role) {
      return user.role.toLowerCase();
    }
    if (user.userType) {
      return user.userType.toLowerCase();
    }
  }
  
  return 'agent'; // default
};

const Layout: React.FC = () => {
  const authState = useSelector((state: any) => state.auth);
  const user = authState?.user || null;
  const userRole = getUserRole(user);
  
  // If user is customer, show the full CustomerLayout
  if (userRole === 'customer') {
    return <CustomerLayout />;
  }

  // For agents/admins, show the regular layout with Header
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex-shrink-0 z-[100]">
        <Header />
      </header>
      
      <main className="flex-1 overflow-y-auto bg-[#f0f8ff]">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;